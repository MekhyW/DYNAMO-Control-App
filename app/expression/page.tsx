"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ScanFace } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [isExprTracking, setIsExprTracking] = useState(true);
  const [isEyeTracking, setIsEyeTracking] = useState(true);
  const [activeExpression, setActiveExpression] = useState<number | null>(null);
  const [showMotorDialog, setShowMotorDialog] = useState(false);
  const [motorEnabled, setMotorEnabled] = useState(true);
  
  const {
    toggleFaceExpressionTracking,
    toggleEyeTracking,
    toggleEyebrows,
    setExpression,
  } = useTelegramBot();

  const handleToggleExprTracking = () => {
    const newTrackingState = !isExprTracking;
    setIsExprTracking(newTrackingState);
    toggleFaceExpressionTracking(newTrackingState);
    
    if (!newTrackingState) {
      setActiveExpression(null);
    }
  };

  const handleToggleEyeTracking = () => {
    const newEyeTrackingState = !isEyeTracking;
    setIsEyeTracking(newEyeTrackingState);
    toggleEyeTracking(newEyeTrackingState);
  };

  const handleExpressionSelect = (expressionId: number) => {
    const newActiveExpression = expressionId === activeExpression ? null : expressionId;
    
    if (expressionId !== activeExpression) {
      setIsExprTracking(false);
      toggleFaceExpressionTracking(false);
    }
    
    setActiveExpression(newActiveExpression);
    
    if (newActiveExpression !== null) {
      setExpression(expressionId);
    }
  };

  const handleMotorToggle = () => {
    if (!motorEnabled) {
      setShowMotorDialog(true);
    } else {
      const newMotorState = false;
      setMotorEnabled(newMotorState);
      toggleEyebrows(newMotorState);
    }
  };
  
  const handleEnableMotors = () => {
    const newMotorState = true;
    setMotorEnabled(newMotorState);
    toggleEyebrows(newMotorState);
    setShowMotorDialog(false);
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
                  <span className="font-medium">Face Expression Tracking</span>
                </div>
                <Switch
                  checked={isExprTracking}
                  onCheckedChange={handleToggleExprTracking}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isEyeTracking ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Eye Tracking</span>
                </div>
                <Switch
                  checked={isEyeTracking}
                  onCheckedChange={handleToggleEyeTracking}
                />
              </div>

              {/* Motor Control */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    motorEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">Eyebrows (Motor Control)</span>
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
            <AlertDialogTitle>Enable Motor Control?</AlertDialogTitle>
            <AlertDialogDescription>
              Enabling motor control will allow physical movement of expression components.
              Please ensure the area around the device is clear before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnableMotors}
            >
              Enable Motors
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}