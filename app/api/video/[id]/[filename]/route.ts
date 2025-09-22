import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string; filename: string } }) {
  try {
    const { id, filename } = params;
    if (!id || !filename) {
      return NextResponse.json({ error: 'Video ID and filename are required' }, { status: 400 });
    }
    const tmpfileUrl = `https://tmpfiles.org/dl/${id}/${filename}`;
    const response = await fetch(tmpfileUrl, {method: 'GET', headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',},});
    if (!response.ok) {
      return NextResponse.json({ error: 'Video not found or expired' }, { status: response.status });
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');
    console.log(`Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*', // Allow cross-origin requests for Unity
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    });
    if (contentLength) { headers.set('Content-Length', contentLength); }
    if (contentDisposition) { headers.set('Content-Disposition', contentDisposition); }
    const range = request.headers.get('range');
    if (range && contentLength) {
      console.log(`Range request: ${range}`);
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
      const chunksize = (end - start) + 1;
      headers.set('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', chunksize.toString());
      const rangeResponse = await fetch(tmpfileUrl, {method: 'GET', headers: {'Range': range, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',},});
      if (rangeResponse.status === 206) {
        return new NextResponse(rangeResponse.body, {status: 206, headers,});
      }
    }
    return new NextResponse(response.body, {status: 200, headers,});
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}