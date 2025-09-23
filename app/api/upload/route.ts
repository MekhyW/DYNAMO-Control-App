import { NextRequest, NextResponse } from 'next/server';
import { VideoProcessor } from '@/lib/video-processor';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) { return NextResponse.json({ error: 'No file provided' }, { status: 400 }); }
    let processedFile: File | Buffer = file;
    let processedFileName = file.name;
    let processingInfo: any = null;
    try {
      console.log(`Processing video file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const result = await VideoProcessor.processVideo(fileBuffer, file.name, {
        maxFileSize: 8, // 8MB to stay under tmpfiles.org limit
        quality: 'medium',
        maxDuration: 300, // 5 minutes max
        maxWidth: 1280,
        maxHeight: 720,
      });
      processedFile = result.buffer;
      processedFileName = file.name.replace(/\.[^/.]+$/, '.mp4'); // Change extension to .mp4
      processingInfo = {
        originalSize: result.originalSize,
        processedSize: result.processedSize,
        compressionRatio: result.compressionRatio,
        format: result.format,
      };
      console.log(`Video processed successfully: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB → ${(result.processedSize / 1024 / 1024).toFixed(2)}MB (${result.compressionRatio.toFixed(2)}x compression)`);
    } catch (processingError) {
      console.error('Video processing failed:', processingError);
      return NextResponse.json({ error: 'Video processing failed', details: processingError instanceof Error ? processingError.message : 'Unknown processing error' }, { status: 500 });
    }
    const fileIoFormData = new FormData();
    if (processedFile instanceof Buffer) {
      const processedBlob = new Blob([processedFile], { type: 'video/mp4' });
      const processedFileObj = new File([processedBlob], processedFileName, { type: 'video/mp4' });
      fileIoFormData.append('file', processedFileObj);
    } else {
      fileIoFormData.append('file', processedFile);
    }
    console.log(`Uploading file: ${processedFileName}`);
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {method: 'POST', body: fileIoFormData,});
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`tmpfiles.org upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`tmpfiles.org upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const result = await response.json();
    if (result.status === 'success' && result.data && result.data.url) {
      // tmpfiles.org returns URLs like: http://tmpfiles.org/12345/filename.ext
      // Direct download URL is: https://tmpfiles.org/dl/12345/filename.ext
      const tmpfileUrl = result.data.url;
      const urlParts = tmpfileUrl.split('/');
      const fileId = urlParts[urlParts.length - 2];
      const filename = urlParts[urlParts.length - 1];
      const proxyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}/api/video/${fileId}/${filename}`;
      return NextResponse.json({ 
        success: true, 
        url: proxyUrl,
        originalUrl: tmpfileUrl, // Keep original for debugging
        fileId: fileId,
        fileName: filename,
        processing: processingInfo, // Include processing information if video was processed
      });
    } else {
      throw new Error(`tmpfiles.org upload failed: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}