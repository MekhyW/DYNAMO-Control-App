"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ScanFace } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useMQTT } from '@/hooks/useMQTT';
import { DecryptedText } from '@/components/ui/decrypted-text';
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
  { id: 3, name: 'Neutral', preview: '😐' },
  { id: 2, name: 'Happy', preview: '😊' },
  { id: 4, name: 'Sad', preview: '😢' },
  { id: 0, name: 'Angry', description: ' ', preview: '😠' },
  { id: 5, name: 'Surprised', preview: '😲' },  
  { id: 1, name: 'Disgusted', preview: '😒' },
  { id: 12, name: 'Mischievous', preview: '😏' },
  { id: 6, name: 'Hypnotic', preview: '😵‍💫' },
  { id: 7, name: 'Heart', preview: '❤️' },
  { id: 8, name: 'Rainbow', preview: '🌈' },
  { id: 9, name: 'Nightmare', preview: '😈' },
  { id: 10, name: 'Gear Eyes', preview: '⚙️' },
  { id: 11, name: 'SANS', preview: '💀' },
];

export default function ExpressionControl() {
  const mqtt = useMQTT();
  const [isExprTracking, setIsExprTracking] = useState(true);
  const [isEyeTracking, setIsEyeTracking] = useState(true);
  const [activeExpression, setActiveExpression] = useState<number | null>(null);
  const [showMotorDialog, setShowMotorDialog] = useState(false);
  const [motorEnabled, setMotorEnabled] = useState(true);

  const toggleExprTracking = async () => {
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
    const newState = !isEyeTracking;
    setIsEyeTracking(newState);
    try {
      await mqtt.toggleEyeTracking(newState);
    } catch (error) {
      console.error('Failed to toggle eye tracking:', error);
    }
  };

  const handleExpressionSelect = async (expressionId: number) => {
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

              {/* Motor Control */}
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
                    <div className="text-4xl mb-2">{expression.preview}</div>
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