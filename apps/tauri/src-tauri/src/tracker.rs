use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackedEntry {
    pub media_type: String,
    pub media_id: i64,
    pub title: String,
    pub executables: Vec<String>,
    pub accumulated_seconds: u64,
    pub pending_sync_hours: u64,
    #[serde(default)]
    pub is_paused: bool,
    #[serde(skip_deserializing, default)]
    pub is_running: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TrackerStore {
    #[serde(default)]
    global_paused: bool,
    #[serde(default)]
    entries: Vec<TrackedEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningProcessInfo {
    pub pid: u32,
    pub name: String,
    pub exe_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HourReadyPayload {
    pub media_type: String,
    pub media_id: i64,
    pub pending_sync_hours: u64,
}

pub struct TrackerState {
    store: Arc<Mutex<TrackerStore>>,
}

impl TrackerState {
    pub fn new() -> Self {
        Self {
            store: Arc::new(Mutex::new(TrackerStore::default())),
        }
    }
}

fn tracker_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve config directory: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config directory: {e}"))?;
    Ok(dir.join("tracker.json"))
}

fn load_store(app: &AppHandle) -> TrackerStore {
    let Ok(path) = tracker_file_path(app) else {
        return TrackerStore::default();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return TrackerStore::default();
    };
    if let Ok(store) = serde_json::from_str::<TrackerStore>(&raw) {
        return store;
    }
    // Backwards compatibility if tracker.json was previously a plain array
    if let Ok(entries) = serde_json::from_str::<Vec<TrackedEntry>>(&raw) {
        return TrackerStore {
            global_paused: false,
            entries,
        };
    }
    TrackerStore::default()
}

fn save_store(app: &AppHandle, store: &TrackerStore) {
    let Ok(path) = tracker_file_path(app) else {
        return;
    };
    if let Ok(json) = serde_json::to_string_pretty(store) {
        let _ = fs::write(path, json);
    }
}

fn is_blacklisted_process(name: &str) -> bool {
    let lower = name.trim().to_ascii_lowercase();
    let stem = lower.strip_suffix(".exe").unwrap_or(&lower);
    matches!(
        stem,
        "system"
            | "idle"
            | "registry"
            | "smss"
            | "csrss"
            | "wininit"
            | "services"
            | "lsass"
            | "svchost"
            | "fontdrvhost"
            | "dwm"
            | "explorer"
            | "taskhostw"
            | "sihost"
            | "ctfmon"
            | "conhost"
            | "runtimebroker"
            | "searchhost"
            | "startmenuexperiencehost"
            | "shellexperiencehost"
            | "applicationframehost"
            | "dllhost"
            | "spoolsv"
            | "audiodg"
            | "msedgewebview2"
            | "nameless-liberty"
            | "namelessliberty"
            | "systemd"
            | "dbus-daemon"
            | "dbus-broker"
            | "wireplumber"
            | "pipewire"
            | "pipewire-pulse"
            | "polkitd"
            | "bash"
            | "zsh"
            | "fish"
            | "sh"
    )
}

fn normalize_exe_token(raw: &str) -> String {
    let trimmed = raw.trim();
    let file_name = Path::new(trimmed)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(trimmed);
    file_name.to_ascii_lowercase()
}

fn process_matches(linked_executables: &[String], active_tokens: &HashSet<String>) -> bool {
    linked_executables.iter().any(|exe| {
        let norm = normalize_exe_token(exe);
        if norm.is_empty() {
            return false;
        }
        let stem = norm.strip_suffix(".exe").unwrap_or(&norm);
        active_tokens.contains(&norm) || active_tokens.contains(stem)
    })
}

fn collect_active_tokens(sys: &System) -> HashSet<String> {
    let mut tokens = HashSet::new();
    for process in sys.processes().values() {
        let name = process.name().to_string_lossy().to_ascii_lowercase();
        if !name.is_empty() {
            if let Some(stem) = name.strip_suffix(".exe") {
                tokens.insert(stem.to_string());
            }
            tokens.insert(name);
        }
        if let Some(exe) = process.exe() {
            if let Some(file_name) = exe.file_name().and_then(|s| s.to_str()) {
                let lower = file_name.to_ascii_lowercase();
                if let Some(stem) = lower.strip_suffix(".exe") {
                    tokens.insert(stem.to_string());
                }
                tokens.insert(lower);
            }
        }
    }
    tokens
}

pub fn start_tracker_loop(app: AppHandle, state: TrackerState) {
    {
        let loaded = load_store(&app);
        if let Ok(mut guard) = state.store.lock() {
            *guard = loaded;
        }
    }

    let store_arc = Arc::clone(&state.store);
    app.manage(state);

    std::thread::spawn(move || {
        let mut sys = System::new();
        let mut tick_count: u64 = 0;

        loop {
            std::thread::sleep(Duration::from_secs(1));
            tick_count += 1;

            sys.refresh_processes(ProcessesToUpdate::All, true);
            let active_tokens = collect_active_tokens(&sys);

            let mut dirty = false;
            let mut ready_events: Vec<HourReadyPayload> = Vec::new();
            let snapshot: Vec<TrackedEntry>;

            {
                let Ok(mut store) = store_arc.lock() else {
                    continue;
                };

                let global_paused = store.global_paused;
                for entry in store.entries.iter_mut() {
                    let running =
                        !entry.executables.is_empty() && process_matches(&entry.executables, &active_tokens);

                    if entry.is_running != running {
                        entry.is_running = running;
                        dirty = true;
                    }

                    if running && !global_paused && !entry.is_paused {
                        entry.accumulated_seconds += 1;
                        if entry.accumulated_seconds >= 3600 {
                            entry.accumulated_seconds -= 3600;
                            entry.pending_sync_hours += 1;
                            dirty = true;
                            ready_events.push(HourReadyPayload {
                                media_type: entry.media_type.clone(),
                                media_id: entry.media_id,
                                pending_sync_hours: entry.pending_sync_hours,
                            });
                        }
                    }
                }

                if dirty || tick_count % 15 == 0 {
                    save_store(&app, &store);
                }

                snapshot = store.entries.clone();
            }

            for payload in ready_events {
                let _ = app.emit("tracker-hour-ready", payload);
            }

            if !snapshot.is_empty() {
                let _ = app.emit("tracker-state", snapshot);
            }
        }
    });
}

#[tauri::command]
pub fn tracker_get_running_processes() -> Vec<RunningProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut by_name: HashMap<String, RunningProcessInfo> = HashMap::new();
    for (pid, process) in sys.processes() {
        let name = process.name().to_string_lossy().to_string();
        if name.trim().is_empty() || is_blacklisted_process(&name) {
            continue;
        }
        let exe_path = process
            .exe()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let key = name.to_ascii_lowercase();
        by_name.entry(key).or_insert(RunningProcessInfo {
            pid: pid.as_u32(),
            name,
            exe_path,
        });
    }

    let mut list: Vec<RunningProcessInfo> = by_name.into_values().collect();
    list.sort_by(|a, b| a.name.to_ascii_lowercase().cmp(&b.name.to_ascii_lowercase()));
    list
}

#[tauri::command]
pub fn tracker_get_global_paused(state: State<'_, TrackerState>) -> bool {
    state
        .store
        .lock()
        .map(|g| g.global_paused)
        .unwrap_or(false)
}

#[tauri::command]
pub fn tracker_toggle_global_pause(
    app: AppHandle,
    state: State<'_, TrackerState>,
) -> Result<bool, String> {
    let mut guard = state
        .store
        .lock()
        .map_err(|_| "Tracker lock poisoned".to_string())?;
    guard.global_paused = !guard.global_paused;
    let paused = guard.global_paused;
    save_store(&app, &guard);
    let _ = app.emit("tracker-global-paused", paused);
    Ok(paused)
}

#[tauri::command]
pub fn tracker_get_all(state: State<'_, TrackerState>) -> Vec<TrackedEntry> {
    state
        .store
        .lock()
        .map(|g| g.entries.clone())
        .unwrap_or_default()
}

#[tauri::command]
pub fn tracker_get_entry(
    state: State<'_, TrackerState>,
    media_type: String,
    media_id: i64,
) -> Option<TrackedEntry> {
    let norm_type = media_type.to_ascii_lowercase();
    state.store.lock().ok().and_then(|g| {
        g.entries
            .iter()
            .find(|e| e.media_type == norm_type && e.media_id == media_id)
            .cloned()
    })
}

#[tauri::command]
pub fn tracker_set_executables(
    app: AppHandle,
    state: State<'_, TrackerState>,
    media_type: String,
    media_id: i64,
    title: String,
    executables: Vec<String>,
) -> Result<TrackedEntry, String> {
    let norm_type = media_type.to_ascii_lowercase();
    let mut seen = HashSet::new();
    let cleaned: Vec<String> = executables
        .into_iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && seen.insert(s.to_ascii_lowercase()))
        .collect();

    let mut guard = state
        .store
        .lock()
        .map_err(|_| "Tracker lock poisoned".to_string())?;

    let updated = if let Some(entry) = guard
        .entries
        .iter_mut()
        .find(|e| e.media_type == norm_type && e.media_id == media_id)
    {
        entry.title = title;
        entry.executables = cleaned;
        if entry.executables.is_empty() {
            entry.is_running = false;
        }
        entry.clone()
    } else {
        let entry = TrackedEntry {
            media_type: norm_type,
            media_id,
            title,
            executables: cleaned,
            accumulated_seconds: 0,
            pending_sync_hours: 0,
            is_paused: false,
            is_running: false,
        };
        guard.entries.push(entry.clone());
        entry
    };

    save_store(&app, &guard);
    let _ = app.emit("tracker-state", guard.entries.clone());
    Ok(updated)
}

#[tauri::command]
pub fn tracker_toggle_pause(
    app: AppHandle,
    state: State<'_, TrackerState>,
    media_type: String,
    media_id: i64,
    title: Option<String>,
) -> Result<TrackedEntry, String> {
    let norm_type = media_type.to_ascii_lowercase();
    let mut guard = state
        .store
        .lock()
        .map_err(|_| "Tracker lock poisoned".to_string())?;

    let updated = if let Some(entry) = guard
        .entries
        .iter_mut()
        .find(|e| e.media_type == norm_type && e.media_id == media_id)
    {
        entry.is_paused = !entry.is_paused;
        entry.clone()
    } else {
        let entry = TrackedEntry {
            media_type: norm_type,
            media_id,
            title: title.unwrap_or_default(),
            executables: Vec::new(),
            accumulated_seconds: 0,
            pending_sync_hours: 0,
            is_paused: true,
            is_running: false,
        };
        guard.entries.push(entry.clone());
        entry
    };

    save_store(&app, &guard);
    let _ = app.emit("tracker-state", guard.entries.clone());
    Ok(updated)
}

#[tauri::command]
pub fn tracker_ack_synced_hours(
    app: AppHandle,
    state: State<'_, TrackerState>,
    media_type: String,
    media_id: i64,
    count: u64,
) -> Result<Option<TrackedEntry>, String> {
    let norm_type = media_type.to_ascii_lowercase();
    let mut guard = state
        .store
        .lock()
        .map_err(|_| "Tracker lock poisoned".to_string())?;

    let mut result = None;
    if let Some(entry) = guard
        .entries
        .iter_mut()
        .find(|e| e.media_type == norm_type && e.media_id == media_id)
    {
        entry.pending_sync_hours = entry.pending_sync_hours.saturating_sub(count);
        result = Some(entry.clone());
    }

    save_store(&app, &guard);
    let _ = app.emit("tracker-state", guard.entries.clone());
    Ok(result)
}
