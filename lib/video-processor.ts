import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { configureFfmpeg, isFfmpegAvailable } from './ffmpeg-config';

export interface VideoProcessingOptions {
  maxFileSize?: number; // in MB, default 8MB to stay under 10MB limit
  quality?: 'low' | 'medium' | 'high'; // default medium
  maxDuration?: number; // in seconds, default 60
  maxWidth?: number; // default 1280
  maxHeight?: number; // default 720
}

export interface ProcessedVideoResult {
  buffer: Buffer;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  format: string;
}

const DEFAULT_OPTIONS: Required<VideoProcessingOptions> = {
  maxFileSize: 8, // 8MB to stay under tmpfiles.org limit
  quality: 'medium',
  maxDuration: 60,
  maxWidth: 1280,
  maxHeight: 720,
};

export class VideoProcessor {
  private static getQualitySettings(quality: 'low' | 'medium' | 'high') {
    switch (quality) {
      case 'low':
        return {
          videoBitrate: '500k',
          audioBitrate: '64k',
          crf: 28,
        };
      case 'medium':
        return {
          videoBitrate: '1000k',
          audioBitrate: '128k',
          crf: 23,
        };
      case 'high':
        return {
          videoBitrate: '2000k',
          audioBitrate: '192k',
          crf: 18,
        };
    }
  }

  private static async createTempFile(buffer: Buffer, extension: string): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFileName = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    await fs.writeFile(tempFilePath, new Uint8Array(buffer));
    return tempFilePath;
  }

  private static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  static async processVideo(inputBuffer: Buffer, originalFileName: string, options: VideoProcessingOptions = {}): Promise<ProcessedVideoResult> {
    configureFfmpeg();
    const ffmpegAvailable = await isFfmpegAvailable();
    if (!ffmpegAvailable) { throw new Error('FFmpeg is not available. Please install FFmpeg to process videos.'); }
    if (!inputBuffer || inputBuffer.length === 0) { throw new Error('Invalid input buffer: Buffer is empty or null'); }
    if (!originalFileName || originalFileName.trim() === '') { throw new Error('Invalid filename: Filename is empty or null'); }
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = inputBuffer.length;
    const maxInputSize = 100 * 1024 * 1024; // 100MB max input
    if (originalSize > maxInputSize) { throw new Error(`Input file too large: ${(originalSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size (100MB)`); }
    const inputExtension = path.extname(originalFileName).slice(1) || 'mp4';
    const supportedExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
    if (!supportedExtensions.includes(inputExtension.toLowerCase())) { throw new Error(`Unsupported file format: .${inputExtension}. Supported formats: ${supportedExtensions.join(', ')}`); }
    const inputPath = await this.createTempFile(inputBuffer, inputExtension);
    const outputPath = await this.createTempFile(Buffer.alloc(0), 'mp4');
    try {
      const qualitySettings = this.getQualitySettings(opts.quality);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video processing timeout: Processing took longer than 5 minutes'));
        }, 5 * 60 * 1000);
        let command = ffmpeg(inputPath)
          .output(outputPath)
          .format('mp4')
          .videoCodec('libx264')
          .audioCodec('aac')
          .videoBitrate(qualitySettings.videoBitrate)
          .audioBitrate(qualitySettings.audioBitrate)
          .outputOptions([
            '-crf', qualitySettings.crf.toString(),
            '-preset', 'medium', // Balance between speed and compression
            '-movflags', '+faststart', // Enable progressive download
            '-pix_fmt', 'yuv420p', // Ensure compatibility with most players
            '-profile:v', 'baseline', // H.264 baseline profile for maximum compatibility
            '-level', '3.0', // H.264 level for compatibility
            '-avoid_negative_ts', 'make_zero', // Fix timestamp issues
            '-threads', '0', // Use all available CPU cores
            '-max_muxing_queue_size', '1024', // Prevent muxing queue overflow
          ]);
        if (opts.maxWidth && opts.maxHeight) { command = command.size(`${opts.maxWidth}x${opts.maxHeight}`); } //size constraing
        if (opts.maxDuration) { command = command.duration(opts.maxDuration); } //duration constraint
        command
          .on('start', (commandLine) => { console.log('FFmpeg process started:', commandLine); })
          .on('progress', (progress) => { console.log(`Processing: ${Math.round(progress.percent || 0)}% done`); })
          .on('end', () => {
            clearTimeout(timeout);
            console.log('Video processing completed');
            resolve();
          })
          .on('error', (err, stdout, stderr) => {
            clearTimeout(timeout);
            console.error('FFmpeg error:', err);
            console.error('FFmpeg stdout:', stdout);
            console.error('FFmpeg stderr:', stderr);
            let errorMessage = `Video processing failed: ${err.message}`;
            if (stderr) {
              if (stderr.includes('Invalid data found when processing input')) {
                errorMessage = 'Invalid video file: The file appears to be corrupted or not a valid video format';
              } else if (stderr.includes('No space left on device')) {
                errorMessage = 'Processing failed: Insufficient disk space for video processing';
              } else if (stderr.includes('Permission denied')) {
                errorMessage = 'Processing failed: Permission denied while accessing temporary files';
              }
            }
            reject(new Error(errorMessage));
          })
          .run();
      });
      const processedBuffer = await fs.readFile(outputPath);
      const processedSize = processedBuffer.length;
      const compressionRatio = originalSize / processedSize;
      const maxSizeBytes = opts.maxFileSize * 1024 * 1024;
      if (processedSize > maxSizeBytes) {
        if (opts.quality !== 'low') {
          console.log('File still too large, retrying with lower quality...');
          return this.processVideo(inputBuffer, originalFileName, {...opts, quality: opts.quality === 'high' ? 'medium' : 'low',});
        } else {
          throw new Error(`Video file is too large (${(processedSize / 1024 / 1024).toFixed(2)}MB) even after maximum compression`);
        }
      }
      return {
        buffer: processedBuffer,
        originalSize,
        processedSize,
        compressionRatio,
        format: 'mp4',
      };
    } finally {
      await this.cleanupTempFile(inputPath);
      await this.cleanupTempFile(outputPath);
    }
  }

  static async getVideoInfo(buffer: Buffer, originalFileName: string): Promise<any> {
    configureFfmpeg();
    const inputExtension = path.extname(originalFileName).slice(1) || 'mp4';
    const inputPath = await this.createTempFile(buffer, inputExtension);
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });
    } finally {
      await this.cleanupTempFile(inputPath);
    }
  }
}