"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ScanFace, Rainbow } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useMQTT } from '@/hooks/useMQTT';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const expressionPresets = [
  { id: 3, name: 'Neutral', preview: '/expr-neutral.gif' },
  { id: 2, name: 'Happy', preview: '/expr-happy.gif' },
  { id: 4, name: 'Sad', preview: '/expr-sad.gif' },
  { id: 0, name: 'Angry', preview: '/expr-angry.gif' },
  { id: 5, name: 'Surprised', preview: '/expr-surprised.gif' },  
  { id: 1, name: 'Disgusted', preview: '/expr-disgusted.gif' },
  { id: 12, name: 'Mischievous', preview: '/expr-mischievous.gif' },
  { id: 6, name: 'Hypnotic', preview: '/expr-hypnotic.gif' },
  { id: 7, name: 'Heart', preview: '/expr-heart.gif' },
  { id: 8, name: 'Rainbow', preview: '/expr-rainbow.gif' },
  { id: 9, name: 'Nightmare', preview: '/expr-nightmare.gif' },
  { id: 10, name: 'Gear Eyes', preview: '/expr-gear.gif' },
  { id: 11, name: 'SANS', preview: '/expr-sans.gif' },
];

export default function ExpressionControl() {
  const { playSound } = useSoundPlayer();
  const mqtt = useMQTT();
  const [isExprTracking, setIsExprTracking] = useState(true);
  const [isEyeTracking, setIsEyeTracking] = useState(true);
  const [activeExpression, setActiveExpression] = useState<number | null>(null);
  const [showMotorDialog, setShowMotorDialog] = useState(false);
  const [motorEnabled, setMotorEnabled] = useState(true);
  const [sillyMode, setSillyMode] = useState(false);

  const toggleExprTracking = async () => {
    playSound('major');
    const newState = !isExprTracking;
    setIsExprTracking(newState);
    if (!newState) {
      setActiveExpression(null);
    }
    try {
      await mqtt.toggleFaceExpressionTracking(newState);
    } catch (error) {
      console.error('Failed to toggle face expression tracking:', error);
    }
  };

  const toggleEyeTracking = async () => {
    playSound('major');
    const newState = !isEyeTracking;
    setIsEyeTracking(newState);
    try {
      await mqtt.toggleEyeTracking(newState);
    } catch (error) {
      console.error('Failed to toggle eye tracking:', error);
    }
  };

  const handleExpressionSelect = async (expressionId: number) => {
    playSound('major');
    if (expressionId !== activeExpression) {
      setIsExprTracking(false);
      try {
        await mqtt.toggleFaceExpressionTracking(false);
      } catch (error) {
        console.error('Failed to disable face expression tracking:', error);
      }
    }
    
    const newActiveExpression = expressionId === activeExpression ? null : expressionId;
    setActiveExpression(newActiveExpression);
    
    if (newActiveExpression !== null) {
      try {
        await mqtt.setExpression(expressionId.toString());
      } catch (error) {
        console.error('Failed to set expression:', error);
      }
    }
  };

  const handleMotorToggle = async () => {
    playSound('major');
    if (!motorEnabled) {
      setShowMotorDialog(true);
    } else {
      setMotorEnabled(false);
      try {
        await mqtt.toggleEyebrows(false);
      } catch (error) {
        console.error('Failed to toggle eyebrows:', error);
      }
    }
  };

  const toggleSillyMode = async () => {
    playSound('major');
    const newState = !sillyMode;
    setSillyMode(newState);
    try {
      await mqtt.setExpression(newState ? "SillyON" : "SillyOFF");
    } catch (error) {
      console.error('Failed to toggle silly mode:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-5 h-screen flex flex-col">
      <div className="flex flex-col h-full">

        {/* Main Controls - Fixed */}
        <Card className="mb-6 flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Tracking Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isExprTracking ? (
                    <ScanFace className="h-5 w-5 text-primary" />
                  ) : (
                    <ScanFace className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    <DecryptedText 
                      text="Face Expression Tracking" 
                      animateOn="view" 
                      speed={50} 
                      maxIterations={7}
                      className="font-medium"
                    />
                  </span>
                </div>
                <Switch
                  checked={isExprTracking}
                  onCheckedChange={toggleExprTracking}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isEyeTracking ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    <DecryptedText 
                      text="Eye Tracking" 
                      animateOn="view" 
                      speed={50} 
                      maxIterations={7}
                      className="font-medium"
                    />
                  </span>
                </div>
                <Switch
                  checked={isEyeTracking}
                  onCheckedChange={toggleEyeTracking}
                />
              </div>

              {/* Motor Control 
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    motorEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">
                    <DecryptedText 
                      text="Eyebrows (Motor Control)" 
                      animateOn="view" 
                      speed={50} 
                      maxIterations={7}
                      className="font-medium"
                    />
                  </span>
                </div>
                <Switch
                  checked={motorEnabled}
                  onCheckedChange={handleMotorToggle}
                />
              </div>
              */}

              {/* Silly Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Rainbow className={cn(
                    "h-5 w-5",
                    sillyMode ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">
                    <DecryptedText 
                      text="Silly!!" 
                      animateOn="view" 
                      speed={50} 
                      maxIterations={7}
                      className="font-medium"
                    />
                  </span>
                </div>
                <Switch
                  checked={sillyMode}
                  onCheckedChange={toggleSillyMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expression Presets Grid - Scrollable */}
        <div className="overflow-y-auto flex-1 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {expressionPresets.map((expression) => (
              <Card 
                key={expression.id}
                className={cn(
                  "cursor-pointer transition-all",
                  activeExpression === expression.id && "border-primary bg-accent"
                )}
                onClick={() => handleExpressionSelect(expression.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 mb-2 flex items-center justify-center">
                      <img 
                        src={expression.preview} 
                        alt={expression.name}
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    <h3 className="font-medium">{expression.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Motor Safety Confirmation Dialog */}
      <AlertDialog open={showMotorDialog} onOpenChange={setShowMotorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <DecryptedText 
                text="Enable Motor Control?" 
                animateOn="view" 
                speed={50} 
                maxIterations={7}
              />
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enabling motor control will allow physical movement of expression components.
              Please ensure the area around the device is clear before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                playSound('major');
                setMotorEnabled(true);
                setShowMotorDialog(false);
                try {
                  await mqtt.toggleEyebrows(true);
                } catch (error) {
                  console.error('Failed to enable eyebrows:', error);
                }
              }}
            >
              Enable Motors
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}