import { NextResponse } from 'next/server'
import { authorize } from '@/lib/server/authorize'
import { isPersistentListKey, readList, writeList } from '@/lib/server/persistent-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Device lists are now persisted by the server-side MQTT relay (/api/mqtt/stream).
// This route remains for manual inspection/repair and is restricted to known keys.

export async function GET(request: Request): Promise<NextResponse> {
  const authz = await authorize(request)
  if (!authz.ok) return authz.response

  const url = new URL(request.url)
  const keysParam = url.searchParams.get('keys')
  const keys = keysParam ? keysParam.split(',').map(k => k.trim()).filter(isPersistentListKey) : []
  const result: Record<string, unknown> = {}
  try {
    for (const key of keys) {
      result[key] = await readList(key)
    }
  } catch (error) {
    console.error('Persistent read failed:', error)
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
  return NextResponse.json(result)
}

export async function PUT(request: Request): Promise<NextResponse> {
  const authz = await authorize(request, { ownerOnly: true })
  if (!authz.ok) return authz.response

  const body = await request.json().catch(() => null) as { key?: unknown, value?: unknown } | null
  if (!body || !isPersistentListKey(body.key) || !Array.isArray(body.value)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  try {
    await writeList(body.key, body.value)
  } catch (error) {
    console.error('Persistent write failed:', error)
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}
