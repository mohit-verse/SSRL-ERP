fn main() {
  tauri::Builder::default()
    .build(tauri::generate_context!())
    .expect("error while running tauri application");
}
