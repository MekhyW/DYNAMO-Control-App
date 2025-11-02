import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

const currentUploadSession = new Set<string>();

async function cleanupOldBlobs(excludeFilename?: string): Promise<void> {
  try {
    const { blobs } = await list();
    const now = Date.now();
    const CLEANUP_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds
    for (const blob of blobs) {
      if (currentUploadSession.has(blob.pathname) || blob.pathname === excludeFilename) { continue; }
      const timestampMatch = blob.pathname.match(/^(\d+)-/);
      if (timestampMatch) {
        const blobTimestamp = parseInt(timestampMatch[1]);
        const age = now - blobTimestamp;
        if (age > CLEANUP_THRESHOLD) {
          await del(blob.url);
          console.log('Deleted old blob:', blob.url, `(age: ${Math.round(age / 1000 / 60)} minutes)`);
        }
      } else { // For blobs without timestamp, check uploadedAt metadata if available
        const blobAge = now - new Date(blob.uploadedAt).getTime();
        if (blobAge > CLEANUP_THRESHOLD) {
          await del(blob.url);
          console.log('Deleted old blob (by uploadedAt):', blob.url);
        }
      }
    }
  } catch (error) {
    console.warn('Cleanup failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const additionalRandom = Math.random().toString(36).substring(2, 6);
        const extension = pathname.split('.').pop();
        const uniqueFilename = `${timestamp}-${randomSuffix}-${additionalRandom}.${extension}`;
        currentUploadSession.add(uniqueFilename);
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: 30 * 1024 * 1024, // 30MB
          tokenPayload: JSON.stringify({fileName: pathname, uniqueFileName: uniqueFilename, uploadedAt: new Date().toISOString()})
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
        let uniqueFilename: string | undefined;
        if (tokenPayload) {
          const payload = JSON.parse(tokenPayload);
          console.log('Upload metadata:', payload);
          uniqueFilename = payload.uniqueFileName;
        }
        setTimeout(() => {
          if (uniqueFilename) { currentUploadSession.delete(uniqueFilename); }
          cleanupOldBlobs(uniqueFilename).catch(error => console.warn('Background cleanup failed:', error instanceof Error ? error.message : 'Unknown error'));
        }, 2000); // 2 second delay to ensure upload is fully processed
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 400 });
  }
}