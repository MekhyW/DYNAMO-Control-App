"use client"

import { useState, useRef, useEffect } from 'react';
import { Bot, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type: 'prompt' | 'response';
}

export default function AIControl() {
  const [hotwordEnabled, setHotwordEnabled] = useState(true);
  const [messages] = useState<Message[]>([]);
  const [speechText, setSpeechText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSpeak = () => {
    if (!speechText.trim()) return;
    // Add your text-to-speech logic here
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
                <span className="font-medium">Hotword Detection</span>
              </div>
              <Switch
                checked={hotwordEnabled}
                onCheckedChange={setHotwordEnabled}
              />
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => {
                // logic for triggering the assistant
              }}
            >
              Trigger Now
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface with Prompt/Response Logs */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%]",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <span className="text-xs font-medium mb-1 block">
                        {message.type === 'prompt' ? 'Prompt' : 'Response'}
                      </span>
                      <p>{message.content}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
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
            <h3 className="font-medium mb-2">Text-to-Speech</h3>
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
                Speak
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}