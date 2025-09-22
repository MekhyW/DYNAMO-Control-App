import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const fileIoFormData = new FormData();
    fileIoFormData.append('file', file);
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {method: 'POST', body: fileIoFormData,});
    if (!response.ok) {
      const errorText = await response.text();
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
        fileId: fileId
      });
    } else {
      throw new Error(`tmpfiles.org upload failed: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}