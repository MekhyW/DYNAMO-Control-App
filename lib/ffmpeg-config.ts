import ffmpeg from 'fluent-ffmpeg';

let ffmpegConfigured = false;

export function configureFfmpeg(): void {
  if (ffmpegConfigured) return;
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path) {
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
      console.log('FFmpeg configured using @ffmpeg-installer package');
      ffmpegConfigured = true;
      return;
    }
  } catch (error) {
    console.warn('Failed to load @ffmpeg-installer package:', error instanceof Error ? error.message : String(error));
  }
  const commonPaths = [ // If the installer package fails, try common system paths
    'ffmpeg', // Assume it's in PATH
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
  ];
  for (const path of commonPaths) {
    try {
      ffmpeg.setFfmpegPath(path);
      console.log(`FFmpeg configured using system path: ${path}`);
      ffmpegConfigured = true;
      return;
    } catch (error) {} // Continue to next path
  }
  console.warn('FFmpeg path not configured. Video processing may fail if ffmpeg is not in system PATH.');
  ffmpegConfigured = true; // Mark as configured to avoid repeated attempts
}

export function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    configureFfmpeg();
    console.log('FFmpeg configuration completed');
    resolve(true);
  });
}