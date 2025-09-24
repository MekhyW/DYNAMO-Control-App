import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { list, del } from '@vercel/blob';

async function cleanupOldBlobs(): Promise<void> {
  try {
    const { blobs } = await list();
    for (const blob of blobs) { await del(blob.url); }
  } catch (error) {
    console.warn('Cleanup failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  await cleanupOldBlobs();
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = pathname.split('.').pop();
        const uniqueFilename = `${timestamp}-${randomSuffix}.${extension}`;
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          addRandomSuffix: false,
          maximumSizeInBytes: 20 * 1024 * 1024, // 20MB
          tokenPayload: JSON.stringify({fileName: pathname, uniqueFileName: uniqueFilename, uploadedAt: new Date().toISOString()})
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
        if (tokenPayload) {
          const payload = JSON.parse(tokenPayload);
          console.log('Upload metadata:', payload);
        }
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}