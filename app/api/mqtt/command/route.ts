import { NextResponse } from 'next/server';
import { authorize } from '@/lib/server/authorize';
import { COMMANDS } from '@/lib/server/commands';
import { publishToBroker } from '@/lib/server/mqtt-server';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: { command?: unknown; params?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.command === 'string' ? body.command : '';
  const spec = Object.prototype.hasOwnProperty.call(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (!spec) {
    return NextResponse.json({ error: 'Unknown command' }, { status: 400 });
  }

  const result = await authorize(request, { ownerOnly: spec.ownerOnly, respectAppLock: true });
  if (!result.ok) return result.response;
  const { user, isOwner } = result.auth;

  if (!isOwner && !rateLimit(`cmd:${user.id}`, 60, 10_000)) {
    return NextResponse.json({ error: 'Too many commands, slow down.' }, { status: 429 });
  }

  const params =
    body.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};
  const validated = spec.validate(params);
  if (typeof validated === 'string') {
    return NextResponse.json({ error: validated }, { status: 400 });
  }

  const payload =
    spec.withUser === false ? validated : { ...validated, user: { id: user.id, first_name: user.first_name } };

  try {
    await publishToBroker(spec.topic, payload, { qos: spec.qos, retain: spec.retain });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Failed to publish ${name}:`, error);
    return NextResponse.json({ error: 'Device connection unavailable.' }, { status: 503 });
  }
}
