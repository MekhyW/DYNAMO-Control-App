"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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
  { id: 1, name: 'Happy', description: 'Cheerful expression', preview: '😊' },
  { id: 2, name: 'Sad', description: 'Downcast expression', preview: '😢' },
  { id: 3, name: 'Surprised', description: 'Astonished look', preview: '😲' },
  { id: 4, name: 'Angry', description: 'Stern expression', preview: '😠' },
  { id: 5, name: 'Neutral', description: 'Default expression', preview: '😐' },
  { id: 6, name: 'Sleepy', description: 'Tired expression', preview: '😴' },
];

export default function ExpressionControl() {
  const [isTracking, setIsTracking] = useState(false);
  const [activeExpression, setActiveExpression] = useState<number | null>(null);
  const [showMotorDialog, setShowMotorDialog] = useState(false);
  const [motorEnabled, setMotorEnabled] = useState(false);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const handleExpressionSelect = (expressionId: number) => {
    setActiveExpression(expressionId === activeExpression ? null : expressionId);
  };

  const handleMotorToggle = () => {
    if (!motorEnabled) {
      setShowMotorDialog(true);
    } else {
      setMotorEnabled(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Expression Control</h1>

        {/* Main Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Tracking Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isTracking ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Expression Tracking</span>
                </div>
                <Switch
                  checked={isTracking}
                  onCheckedChange={toggleTracking}
                />
              </div>

              {/* Motor Control */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    motorEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium">Motor Control</span>
                </div>
                <Switch
                  checked={motorEnabled}
                  onCheckedChange={handleMotorToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expression Presets Grid */}
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
                  <p className="text-sm text-muted-foreground">{expression.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
              onClick={() => {
                setMotorEnabled(true);
                setShowMotorDialog(false);
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