// Allow-list of commands the web app may send to the fursuit, with payload validation.
import { APP_LOCK_TOPIC } from './mqtt-server';

type Params = Record<string, unknown>;
type Validator = (params: Params) => Params | string;

interface CommandSpec {
  topic: string;
  ownerOnly?: boolean;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  withUser?: boolean;
  validate: Validator;
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isNum = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const enabled: Validator = (p) => (isBool(p.enabled) ? { enabled: p.enabled } : 'enabled must be a boolean');
const empty: Validator = () => ({});
const brightness: Validator = (p) => isNum(p.brightness, 0, 255) ? { brightness: p.brightness } : 'brightness out of range';

function isAllowedVideoUrl(value: string): boolean {
  if (value === 'stop') return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch { return false; }
}

export const COMMANDS: Record<string, CommandSpec> = {
  'play-sound-effect': {
    topic: 'dynamo/commands/play-sound-effect',
    validate: (p) => isNum(p.effectId, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) || (typeof p.effectId === 'string' && p.effectId.length <= 200) ? { effectId: p.effectId } : 'invalid effectId',
  },
  'set-voice-effect': {
    topic: 'dynamo/commands/set-voice-effect',
    validate: (p) => isNum(p.effectId, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ? { effectId: p.effectId } : 'invalid effectId',
  },
  'set-output-volume': {
    topic: 'dynamo/commands/set-output-volume',
    validate: (p) => (isNum(p.volume, 0, 100) ? { volume: p.volume } : 'volume out of range'),
  },
  'microphone-toggle': { topic: 'dynamo/commands/microphone-toggle', validate: enabled },
  'voice-changer-toggle': { topic: 'dynamo/commands/voice-changer-toggle', validate: enabled },
  'background-sound-toggle': { topic: 'dynamo/commands/background-sound-toggle', validate: enabled },
  'leds-toggle': { topic: 'dynamo/commands/leds-toggle', validate: enabled },
  'leds-brightness': { topic: 'dynamo/commands/leds-brightness', validate: brightness },
  'eyes-brightness': { topic: 'dynamo/commands/eyes-brightness', validate: brightness },
  'leds-color': {
    topic: 'dynamo/commands/leds-color',
    validate: (p) => typeof p.color === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(p.color) ? { color: p.color } : 'invalid color',
  },
  'leds-effect': {
    topic: 'dynamo/commands/leds-effect',
    validate: (p) => (isStr(p.effect, 64) ? { effect: p.effect } : 'invalid effect'),
  },
  'hotword-detection-toggle': { topic: 'dynamo/commands/hotword-detection-toggle', validate: enabled },
  'hotword-trigger': { topic: 'dynamo/commands/hotword-trigger', validate: empty },
  'text-to-speech': {
    topic: 'dynamo/commands/text-to-speech',
    validate: (p) => (isStr(p.text, 1000) ? { text: p.text } : 'text must be 1-1000 characters'),
  },
  'set-expression': {
    topic: 'dynamo/commands/set-expression',
    validate: (p) => (isStr(p.expression, 64) ? { expression: p.expression } : 'invalid expression'),
  },
  'face-expression-tracking-toggle': { topic: 'dynamo/commands/face-expression-tracking-toggle', validate: enabled },
  'eye-tracking-toggle': { topic: 'dynamo/commands/eye-tracking-toggle', validate: enabled },
  'motors-toggle': { topic: 'dynamo/commands/motors-toggle', validate: enabled },
  'eyes-video': {
    topic: 'dynamo/eyes-video',
    validate: (p) => typeof p.url === 'string' && p.url.length <= 2048 && isAllowedVideoUrl(p.url) ? { url: p.url } : 'url must be an uploaded file or "stop"',
  },

  // Owner-only commands
  'set-sound-device': {
    topic: 'dynamo/commands/set-sound-device',
    ownerOnly: true,
    validate: (p) => (p.deviceType === 'input' || p.deviceType === 'output') && isStr(p.deviceName, 256) ? { deviceType: p.deviceType, deviceName: p.deviceName } : 'invalid sound device',
  },
  'external-commands-lock': {
    topic: 'dynamo/commands/external-commands-lock',
    ownerOnly: true,
    validate: (p) => (isBool(p.locked) ? { locked: p.locked } : 'locked must be a boolean'),
  },
  shutdown: { topic: 'dynamo/commands/shutdown', ownerOnly: true, validate: empty },
  reboot: { topic: 'dynamo/commands/reboot', ownerOnly: true, validate: empty },
  'kill-software': { topic: 'dynamo/commands/kill-software', ownerOnly: true, validate: empty },
  'app-lock': {
    topic: APP_LOCK_TOPIC,
    ownerOnly: true,
    qos: 0,
    retain: true,
    withUser: false,
    validate: (p) => (isBool(p.locked) ? { locked: p.locked } : 'locked must be a boolean'),
  },
};
