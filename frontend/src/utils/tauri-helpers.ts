/**
 * Checks if the app is running in Tauri
 */
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Open native file picker (requires @tauri-apps/plugin-dialog)
 * This is a stub for architecture purposes
 */
export const openNativeFilePicker = async (options?: unknown) => {
  if (!isTauri()) {
    console.warn('Tauri not detected, falling back to web file picker');
    return null;
  }
  // Implement actual tauri dialog when plugin is installed
  // return await open(options);
  console.log('Tauri file picker requested with options', options);
  return null;
};

/**
 * Download using Tauri APIs
 * This is a stub for architecture purposes
 */
export const tauriDownloadFile = async (url: string, filename: string) => {
  if (!isTauri()) {
    throw new Error('Not running in Tauri');
  }
  // Implement actual tauri download logic
  console.log('Tauri download requested for', url, filename);
};
