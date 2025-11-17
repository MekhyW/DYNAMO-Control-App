import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
})

async function ensureSchema() {
  await client.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const keysParam = url.searchParams.get('keys')
  const keys = keysParam ? keysParam.split(',').map(k => k.trim()).filter(Boolean) : []
  await ensureSchema()
  const result: Record<string, any> = {}
  for (const key of keys) {
    const res = await client.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] })
    const row = res.rows?.[0] as any
    if (row && row.value != null) {
      const v = typeof row.value === 'string' ? row.value : String(row.value)
      try {
        result[key] = JSON.parse(v)
      } catch {
        result[key] = v
      }
    } else {
      result[key] = []
    }
  }
  return NextResponse.json(result)
}

export async function PUT(request: Request): Promise<NextResponse> {
  const body = await request.json() as { key: string, value: any }
  if (!body || !body.key) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  await ensureSchema()
  const valueStr = JSON.stringify(body.value ?? null)
  await client.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [body.key, valueStr]
  })
  return NextResponse.json({ ok: true })
}