#[cfg(desktop)]
mod tracker;

use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, State, Url, WebviewWindow};

#[cfg(desktop)]
use tauri::{image::Image, PhysicalPosition, PhysicalSize, WindowEvent};

struct InitialUrlState(Mutex<Option<Url>>);

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WindowState {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    maximized: bool,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct AppConfig {
    server_url: Option<String>,
    last_app: Option<String>,
    window_state: Option<WindowState>,
    #[serde(default)]
    zoom: Option<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AppSettingsPayload {
    server_url: Option<String>,
    zoom: f64,
}

#[cfg(desktop)]
fn icon_bytes_for_app(app_id: &str) -> &'static [u8] {
    match app_id {
        "akaromi" => include_bytes!("../../../next/public/icons/akaromi.png"),
        "borealis" => include_bytes!("../../../next/public/icons/borealis.png"),
        "carina" => include_bytes!("../../../next/public/icons/carina.png"),
        "kiroshi" => include_bytes!("../../../next/public/icons/kiroshi.png"),
        "reliquary" => include_bytes!("../../../next/public/icons/reliquary.png"),
        "tesseract" => include_bytes!("../../../next/public/icons/tesseract.png"),
        _ => include_bytes!("../icons/icon.png"),
    }
}

#[cfg(desktop)]
fn apply_app_icon(window: &WebviewWindow, app_id: &str) -> Result<(), String> {
    let bytes = icon_bytes_for_app(app_id);
    let image = Image::from_bytes(bytes).map_err(|e| format!("Failed to decode icon: {e}"))?;
    window
        .set_icon(image)
        .map_err(|e| format!("Failed to set window icon: {e}"))
}

#[cfg(not(desktop))]
fn apply_app_icon(_window: &WebviewWindow, _app_id: &str) -> Result<(), String> {
    Ok(())
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve config directory: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config directory: {e}"))?;
    let filename = if cfg!(debug_assertions) {
        "config.dev.json"
    } else {
        "config.json"
    };
    Ok(dir.join(filename))
}

fn load_config(app: &AppHandle) -> AppConfig {
    let Ok(path) = config_path(app) else {
        return AppConfig::default();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return AppConfig::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

fn save_config(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {e}"))?;
    fs::write(path, json).map_err(|e| format!("Failed to write config: {e}"))
}

fn normalize_server_url(raw: &str) -> Result<Url, String> {
    let trimmed = raw.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return Err("Server URL cannot be empty.".to_string());
    }

    let with_scheme = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else if trimmed.starts_with("localhost") || trimmed.starts_with("127.0.0.1") {
        format!("http://{trimmed}")
    } else {
        format!("https://{trimmed}")
    };

    let parsed = Url::parse(&with_scheme).map_err(|e| format!("Invalid URL: {e}"))?;
    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        other => Err(format!("Unsupported URL scheme: {other}")),
    }
}

async fn check_server_reachable(url: &Url) -> Result<(), String> {
    let host = url
        .host_str()
        .ok_or_else(|| "URL is missing a host.".to_string())?
        .to_string();
    let port = url
        .port_or_known_default()
        .ok_or_else(|| "URL is missing a port.".to_string())?;

    tauri::async_runtime::spawn_blocking(move || {
        let addr_str = format!("{host}:{port}");
        let addrs: Vec<_> = addr_str
            .to_socket_addrs()
            .map_err(|e| format!("Could not resolve {host}: {e}"))?
            .collect();

        if addrs.is_empty() {
            return Err(format!("Could not resolve host {host}."));
        }

        let timeout = Duration::from_secs(3);
        let mut last_err = String::new();
        for addr in addrs {
            match TcpStream::connect_timeout(&addr, timeout) {
                Ok(_) => return Ok(()),
                Err(e) => last_err = e.to_string(),
            }
        }

        Err(format!("Server at {addr_str} is unreachable ({last_err})."))
    })
    .await
    .map_err(|e| format!("Connection check failed: {e}"))?
}

#[tauri::command]
fn get_server_url(app: AppHandle) -> Option<String> {
    load_config(&app).server_url
}

#[tauri::command]
async fn connect_saved_server(app: AppHandle, window: WebviewWindow) -> Result<String, String> {
    let saved = load_config(&app)
        .server_url
        .ok_or_else(|| "No server URL configured.".to_string())?;
    let parsed = normalize_server_url(&saved)?;
    check_server_reachable(&parsed).await?;

    window
        .navigate(parsed)
        .map_err(|e| format!("Failed to navigate to server: {e}"))?;

    Ok(saved)
}

#[tauri::command]
async fn save_and_connect(
    app: AppHandle,
    window: WebviewWindow,
    url: String,
) -> Result<String, String> {
    let parsed = normalize_server_url(&url)?;
    let normalized = parsed.as_str().trim_end_matches('/').to_string();

    let mut config = load_config(&app);
    config.server_url = Some(normalized.clone());
    save_config(&app, &config)?;

    check_server_reachable(&parsed).await?;

    window
        .navigate(parsed)
        .map_err(|e| format!("Failed to navigate to server: {e}"))?;

    Ok(normalized)
}

#[tauri::command]
fn clear_server_url(app: AppHandle) -> Result<(), String> {
    let mut config = load_config(&app);
    config.server_url = None;
    save_config(&app, &config)
}

#[tauri::command]
fn get_app_settings(app: AppHandle) -> AppSettingsPayload {
    let config = load_config(&app);
    AppSettingsPayload {
        server_url: config.server_url,
        zoom: config.zoom.unwrap_or(1.0).clamp(0.5, 2.0),
    }
}

#[tauri::command]
fn set_zoom(app: AppHandle, window: WebviewWindow, zoom: f64) -> Result<f64, String> {
    let clamped = zoom.clamp(0.5, 2.0);
    let mut config = load_config(&app);
    config.zoom = Some(clamped);
    save_config(&app, &config)?;
    window
        .set_zoom(clamped)
        .map_err(|e| format!("Failed to apply zoom: {e}"))?;
    Ok(clamped)
}

#[tauri::command]
fn reset_window_state(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    let mut config = load_config(&app);
    config.window_state = None;
    save_config(&app, &config)?;
    #[cfg(desktop)]
    {
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        }
        let _ = window.set_size(PhysicalSize::new(1280, 800));
        let _ = window.center();
    }
    #[cfg(not(desktop))]
    let _ = window;
    Ok(())
}

#[tauri::command]
fn reset_and_disconnect(
    app: AppHandle,
    window: WebviewWindow,
    initial_url: State<'_, InitialUrlState>,
) -> Result<(), String> {
    let mut config = load_config(&app);
    config.server_url = None;
    config.last_app = None;
    save_config(&app, &config)?;

    let _ = window.clear_all_browsing_data();

    let fallback = if cfg!(target_os = "windows") {
        Url::parse("http://tauri.localhost").map_err(|e| e.to_string())?
    } else {
        Url::parse("tauri://localhost").map_err(|e| e.to_string())?
    };

    let target = initial_url
        .0
        .lock()
        .ok()
        .and_then(|guard| guard.clone())
        .unwrap_or(fallback);

    window
        .navigate(target)
        .map_err(|e| format!("Failed to navigate to setup screen: {e}"))
}

#[tauri::command]
fn set_active_app(app: AppHandle, window: WebviewWindow, app_id: String) -> Result<(), String> {
    let normalized = app_id.trim().to_lowercase();
    apply_app_icon(&window, &normalized)?;

    let mut config = load_config(&app);
    if config.last_app.as_deref() != Some(&normalized) {
        config.last_app = Some(normalized);
        save_config(&app, &config)?;
    }

    Ok(())
}

#[cfg(not(desktop))]
mod mobile_tracker_stubs {
    #[tauri::command]
    pub fn tracker_get_running_processes() -> Vec<serde_json::Value> {
        Vec::new()
    }

    #[tauri::command]
    pub fn tracker_get_global_paused() -> bool {
        false
    }

    #[tauri::command]
    pub fn tracker_toggle_global_pause() -> Result<bool, String> {
        Ok(false)
    }

    #[tauri::command]
    pub fn tracker_get_all() -> Vec<serde_json::Value> {
        Vec::new()
    }

    #[tauri::command]
    pub fn tracker_get_entry() -> Option<serde_json::Value> {
        None
    }

    #[tauri::command]
    pub fn tracker_set_executables() -> Result<serde_json::Value, String> {
        Err("Process tracking is only supported on desktop.".to_string())
    }

    #[tauri::command]
    pub fn tracker_toggle_pause() -> Result<serde_json::Value, String> {
        Err("Process tracking is only supported on desktop.".to_string())
    }

    #[tauri::command]
    pub fn tracker_ack_synced_hours() -> Result<Option<serde_json::Value>, String> {
        Ok(None)
    }
}

#[cfg(desktop)]
fn save_window_state(window: &tauri::Window) {
    if window.is_minimized().unwrap_or(false) {
        return;
    }

    let app = window.app_handle();
    let mut config = load_config(app);
    let maximized = window.is_maximized().unwrap_or(false);

    if maximized {
        if let Some(existing) = config.window_state.as_mut() {
            existing.maximized = true;
        } else if let (Ok(size), Ok(pos)) = (window.inner_size(), window.outer_position()) {
            config.window_state = Some(WindowState {
                width: size.width,
                height: size.height,
                x: pos.x,
                y: pos.y,
                maximized: true,
            });
        }
    } else if let (Ok(size), Ok(pos)) = (window.inner_size(), window.outer_position()) {
        if size.width >= 400 && size.height >= 300 {
            config.window_state = Some(WindowState {
                width: size.width,
                height: size.height,
                x: pos.x,
                y: pos.y,
                maximized: false,
            });
        }
    }

    let _ = save_config(app, &config);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .manage(InitialUrlState(Mutex::new(None)))
        .setup(|app| {
            let config = load_config(app.handle());
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(url) = window.url() {
                    if let Ok(mut guard) = app.state::<InitialUrlState>().0.lock() {
                        *guard = Some(url);
                    }
                }
                if let Some(zoom) = config.zoom {
                    let _ = window.set_zoom(zoom.clamp(0.5, 2.0));
                }

                #[cfg(desktop)]
                {
                    if let Some(last_app) = config.last_app.as_deref() {
                        let _ = apply_app_icon(&window, last_app);
                    }
                    if let Some(state) = config.window_state {
                        if state.width >= 400 && state.height >= 300 {
                            let _ = window.set_size(PhysicalSize::new(state.width, state.height));
                            let _ = window.set_position(PhysicalPosition::new(state.x, state.y));
                        }
                        if state.maximized {
                            let _ = window.maximize();
                        }
                    }
                }
            }
            #[cfg(desktop)]
            tracker::start_tracker_loop(app.handle().clone(), tracker::TrackerState::new());
            Ok(())
        });

    #[cfg(desktop)]
    let builder = builder
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            match event {
                WindowEvent::CloseRequested { .. }
                | WindowEvent::Resized(_)
                | WindowEvent::Moved(_) => {
                    save_window_state(window);
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_server_url,
            connect_saved_server,
            save_and_connect,
            clear_server_url,
            get_app_settings,
            set_zoom,
            reset_window_state,
            reset_and_disconnect,
            set_active_app,
            tracker::tracker_get_running_processes,
            tracker::tracker_get_global_paused,
            tracker::tracker_toggle_global_pause,
            tracker::tracker_get_all,
            tracker::tracker_get_entry,
            tracker::tracker_set_executables,
            tracker::tracker_toggle_pause,
            tracker::tracker_ack_synced_hours
        ]);

    #[cfg(not(desktop))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        get_server_url,
        connect_saved_server,
        save_and_connect,
        clear_server_url,
        get_app_settings,
        set_zoom,
        reset_window_state,
        reset_and_disconnect,
        set_active_app,
        mobile_tracker_stubs::tracker_get_running_processes,
        mobile_tracker_stubs::tracker_get_global_paused,
        mobile_tracker_stubs::tracker_toggle_global_pause,
        mobile_tracker_stubs::tracker_get_all,
        mobile_tracker_stubs::tracker_get_entry,
        mobile_tracker_stubs::tracker_set_executables,
        mobile_tracker_stubs::tracker_toggle_pause,
        mobile_tracker_stubs::tracker_ack_synced_hours
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
