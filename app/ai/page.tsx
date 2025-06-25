"use client"

import { useState, useRef, useEffect } from 'react';
import { Bot, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useMQTT } from '@/hooks/useMQTT';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';

export default function AIControl() {
  const mqtt = useMQTT();
  const { playSound } = useSoundPlayer();
  const [hotwordEnabled, setHotwordEnabled] = useState(true);
  const [speechText, setSpeechText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [mqtt.chatLogs]);

  const handleHotwordToggle = async (enabled: boolean) => {
    playSound('major');
    setHotwordEnabled(enabled);
    try {
      await mqtt.toggleHotwordDetection(enabled);
    } catch (error) {
      console.error('Failed to toggle hotword detection:', error);
    }
  };

  const handleTriggerHotword = async () => {
    playSound('major');
    try {
      await mqtt.triggerHotword();
    } catch (error) {
      console.error('Failed to trigger hotword:', error);
    }
  };

  const handleSpeak = async () => {
    if (!speechText.trim()) return;
    playSound('major');
    try {
      await mqtt.textToSpeech(speechText);
      setSpeechText(''); // Clear the text after speaking
    } catch (error) {
      console.error('Failed to trigger text-to-speech:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        {/* Main Controls */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  <DecryptedText 
                    text="Hotword Detection" 
                    animateOn="view" 
                    speed={50} 
                    maxIterations={7}
                    className="font-medium"
                  />
                </span>
              </div>
              <Switch
                checked={hotwordEnabled}
                onCheckedChange={handleHotwordToggle}
              />
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={handleTriggerHotword}
            >
              <DecryptedText 
                text="Trigger Now" 
                animateOn="view" 
                speed={40} 
                maxIterations={7}
              />
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface with Prompt/Response Logs */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {mqtt.chatLogs.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'prompt' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%]",
                        message.type === 'prompt'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <span className="text-xs font-medium mb-1 block">
                        {message.type === 'prompt' ? 'Prompt' : 'Response'}
                      </span>
                      <p>{message.content}</p>
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Text-to-Speech Area */}
        <Card>
          <CardContent className="p-4 py-2">
            <h3 className="font-medium mb-2">
              <DecryptedText 
                text="Text-to-Speech" 
                animateOn="view" 
                speed={50} 
                maxIterations={7}
                className="font-medium"
              />
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Enter text to speak..."
                  value={speechText}
                  onChange={(e) => setSpeechText(e.target.value)}
                  className="min-h-[50px]"
                />
              </div>
              <Button
                className="self-end"
                onClick={handleSpeak}
                disabled={!speechText.trim()}
              >
                <Volume2 className="h-5 w-5 mr-2" />
                <DecryptedText 
                  text="Speak" 
                  animateOn="view" 
                  speed={40} 
                  maxIterations={7}
                />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}