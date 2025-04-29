"use client"

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Bot, Wand2 } from 'lucide-react';
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
}

export default function AIControl() {
  const [isListening, setIsListening] = useState(false);
  const [hotwordEnabled, setHotwordEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    // Simulate AI response
    setIsProcessing(true);
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm here to help! What can I do for you?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">

        {/* Main Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
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
                      <p>{message.content}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "transition-colors",
              isListening && "bg-red-100 text-red-500"
            )}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Type your message or speak..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[50px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              className="self-end"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Trigger Button */}
        <Button
          className="fixed bottom-20 right-4 h-16 w-16 rounded-full shadow-lg"
          onClick={() => setIsProcessing(!isProcessing)}
        >
          <Wand2 className={cn(
            "h-8 w-8 transition-transform",
            isProcessing && "animate-spin"
          )} />
        </Button>
      </div>
    </div>
  );
}