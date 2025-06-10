# MQTT Integration Setup Guide

This guide explains how to set up the DYNAMO Control App with HiveMQ Cloud for real-time communication.

## Overview

The DYNAMO Control App now supports MQTT connectivity to communicate with your DYNAMO system in real-time. When connected, the app can:

### Subscribe to Data (Receive from DYNAMO):
- Sound effects list
- Voice effects list
- Bitmap data
- AnyDesk ID
- Sound device list

### Publish Commands (Send to DYNAMO):
- Play sound effects
- Set voice effects
- Control output/microphone volume
- Toggle microphone on/off
- Toggle voice changer on/off
- Control LEDs (on/off, color, effects)
- Hotword detection control
- Text-to-speech commands
- System commands (shutdown, reboot, etc.)

## HiveMQ Cloud Setup

1. **Create a HiveMQ Cloud Account**
   - Go to [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/)
   - Sign up for a free account
   - Create a new cluster

2. **Configure Your Cluster**
   - Note down your cluster URL (e.g., `your-cluster.s1.eu.hivemq.cloud`)
   - Create credentials (username and password)
   - Ensure WebSocket support is enabled on port 8884

3. **Configure the App**
   - Copy `.env.example` to `.env.local` in your project root
   - Fill in your HiveMQ Cloud connection details:
     ```env
     NEXT_PUBLIC_MQTT_HOST=your-cluster.s1.eu.hivemq.cloud
     NEXT_PUBLIC_MQTT_PORT=8884
     NEXT_PUBLIC_MQTT_USERNAME=your-username
     NEXT_PUBLIC_MQTT_PASSWORD=your-password
     ```
   - Restart the development server
    - The app will automatically attempt to connect on startup

4. **Monitor Connection Status**
   - Go to the Admin page in the app
   - Check the "MQTT Connection" card to see if the connection is successful
   - If disconnected, verify your environment variables and HiveMQ Cloud settings

## MQTT Topic Structure

The app uses the following topic structure:

### Data Topics (Subscribe)
- `dynamo/data/sound-effects` - List of available sound effects
- `dynamo/data/voice-effects` - List of available voice effects
- `dynamo/data/bitmap` - Bitmap data
- `dynamo/data/anydesk-id` - AnyDesk ID for remote access
- `dynamo/data/sound-devices` - Available sound devices

### Command Topics (Publish)
- `dynamo/commands/play-sound-effect` - Play a sound effect
- `dynamo/commands/set-voice-effect` - Set active voice effect
- `dynamo/commands/set-output-volume` - Set output volume
- `dynamo/commands/set-microphone-volume` - Set microphone volume
- `dynamo/commands/microphone-toggle` - Toggle microphone
- `dynamo/commands/voice-changer-toggle` - Toggle voice changer
- `dynamo/commands/leds-toggle` - Toggle LEDs
- `dynamo/commands/leds-color` - Set LED color
- `dynamo/commands/leds-effect` - Set LED effect
- `dynamo/commands/hotword-detection-toggle` - Toggle hotword detection
- `dynamo/commands/hotword-trigger` - Trigger hotword
- `dynamo/commands/text-to-speech` - Text-to-speech command
- `dynamo/commands/external-commands-lock` - Lock/unlock external commands
- `dynamo/commands/shutdown` - Shutdown system
- `dynamo/commands/reboot` - Reboot system
- `dynamo/commands/kill-software` - Kill software

## Message Formats

All messages are sent as JSON. Here are some examples:

### Sound Effects Data (Received)
```json
[
  {"id": 1, "name": "Startup Sequence", "filename": "startup.wav"},
  {"id": 2, "name": "System Ready", "filename": "ready.wav"}
]
```

### Voice Effects Data (Received)
```json
[
  {"id": 1, "name": "Robot", "type": "modulation"},
  {"id": 2, "name": "Ghostface", "type": "modulation"}
]
```

### Play Sound Effect Command (Sent)
```json
{"effectId": 1}
```

### Set Volume Command (Sent)
```json
{"volume": 75}
```

### Toggle Commands (Sent)
```json
{"enabled": true}
```

## DYNAMO System Integration

To integrate with your DYNAMO system, you'll need to:

1. **Set up an MQTT client** on your DYNAMO system that connects to the same HiveMQ Cloud cluster
2. **Subscribe to command topics** to receive commands from the app
3. **Publish to data topics** to send current state and available options to the app
4. **Implement command handlers** for each supported command

### Example Python Integration

```python
import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribe to all command topics
    client.subscribe("dynamo/commands/+")
    
    # Publish initial data
    publish_sound_effects(client)
    publish_voice_effects(client)

def on_message(client, userdata, msg):
    topic = msg.topic
    payload = json.loads(msg.payload.decode())
    
    if topic == "dynamo/commands/play-sound-effect":
        play_sound_effect(payload["effectId"])
    elif topic == "dynamo/commands/set-output-volume":
        set_volume(payload["volume"])
    # Add more command handlers...

def publish_sound_effects(client):
    effects = [
        {"id": 1, "name": "Startup Sequence"},
        {"id": 2, "name": "System Ready"}
    ]
    client.publish("dynamo/data/sound-effects", json.dumps(effects))

client = mqtt.Client()
client.username_pw_set("your-username", "your-password")
client.on_connect = on_connect
client.on_message = on_message

client.connect("your-cluster.s1.eu.hivemq.cloud", 8883, 60)
client.loop_forever()
```

## Troubleshooting

### Connection Issues
- Verify your HiveMQ Cloud credentials
- Check that your cluster is active
- Ensure you're using the correct host and port
- Check browser console for error messages

### No Data Received
- Verify your DYNAMO system is publishing to the correct topics
- Check that both the app and DYNAMO system are connected to the same cluster
- Use HiveMQ Cloud's web client to test message publishing

### Commands Not Working
- Ensure your DYNAMO system is subscribed to command topics
- Check message format matches expected JSON structure
- Verify command handlers are implemented correctly

## Security Considerations

- Use strong passwords for your HiveMQ Cloud cluster
- Consider using TLS client certificates for additional security
- Implement proper authentication in your DYNAMO system
- Don't hardcode credentials in your code - use environment variables

## Development

To modify or extend the MQTT functionality:

1. **MQTT Service**: Edit `lib/mqtt.ts` to add new topics or commands
2. **React Hook**: Modify `hooks/useMQTT.ts` to add new state management
3. **UI Components**: Update page components to use new MQTT features

The MQTT integration is designed to be extensible and can easily accommodate new features as your DYNAMO system evolves.