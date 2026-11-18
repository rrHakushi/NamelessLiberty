fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "get_server_url",
                "connect_saved_server",
                "save_and_connect",
                "clear_server_url",
                "set_active_app",
                "tracker_get_running_processes",
                "tracker_get_global_paused",
                "tracker_toggle_global_pause",
                "tracker_get_all",
                "tracker_get_entry",
                "tracker_set_executables",
                "tracker_toggle_pause",
                "tracker_ack_synced_hours",
            ]),
        ),
    )
    .expect("failed to run tauri-build");
}
