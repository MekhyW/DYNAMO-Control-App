import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) { return NextResponse.json({ error: 'No file provided' }, { status: 400 }); }
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) { return NextResponse.json({ error: 'File too large', details: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (50MB)` }, { status: 413 }); }
    console.log(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    let filename: string;
    filename = `temp-video${fileExtension}`;
    const blob = await put(filename, file, {access: 'public', addRandomSuffix: false, allowOverwrite: true,});
    console.log(`File uploaded successfully to Blob Storage: ${blob.url}`);
    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      uniqueFileName: filename,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}