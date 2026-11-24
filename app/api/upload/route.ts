import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import { authorize } from '@/lib/server/authorize';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

const CLEANUP_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

async function cleanupOldBlobs(excludePathname?: string): Promise<void> {
  try {
    const { blobs } = await list();
    const now = Date.now();
    for (const blob of blobs) {
      if (blob.pathname === excludePathname) { continue; }
      const blobAge = now - new Date(blob.uploadedAt).getTime();
      if (blobAge > CLEANUP_THRESHOLD) {
        await del(blob.url);
        console.log('Deleted old blob:', blob.url, `(age: ${Math.round(blobAge / 1000 / 60)} minutes)`);
      }
    }
  } catch (error) {
    console.warn('Cleanup failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // Token requests come from the browser and must be from an allowed Telegram user.
  // Completion callbacks come from Vercel Blob and are verified by handleUpload itself.
  if (body?.type === 'blob.generate-client-token') {
    const authz = await authorize(request, { respectAppLock: true });
    if (!authz.ok) return authz.response;
    if (!authz.auth.isOwner && !rateLimit(`upload:${authz.auth.user.id}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many uploads, try again later.' }, { status: 429 });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          // Random suffix + no overwrite: uploads cannot replace someone else's file.
          addRandomSuffix: true,
          allowOverwrite: false,
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({ uploadedAt: new Date().toISOString() }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload completed:', blob.url);
        setTimeout(() => {
          cleanupOldBlobs(blob.pathname).catch(error => console.warn('Background cleanup failed:', error instanceof Error ? error.message : 'Unknown error'));
        }, 2000); // 2 second delay to ensure upload is fully processed
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
  }
}
