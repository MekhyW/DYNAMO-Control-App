"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ScanFace, Rainbow, Play, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useMQTT } from '@/hooks/useMQTT';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer, SoundType } from '@/components/SoundPlayer';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface MediaUploadPageProps {
  onBack: () => void;
  mqtt: any;
  playSound: (type: SoundType) => void;
}

function MediaUploadPage({ onBack, mqtt, playSound }: MediaUploadPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('Please select an image or video file.');
      }
    }
  };

  const convertImageToVideo = async (imageFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const stream = canvas.captureStream(1); // 1 FPS for static image
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) { chunks.push(event.data); }
        };
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(videoBlob);
        };
        mediaRecorder.start();
        setTimeout(() => {mediaRecorder.stop();}, 5000); // Stop recording after 5 seconds
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const generatePublicUrl = async (file: Blob, filename: string): Promise<string> => {
    // Create a temporary URL for the file
    // In a real implementation, you would upload to a cloud service
    const url = URL.createObjectURL(file);
    
    // For demo purposes, we'll use the blob URL
    // In production, you'd upload to AWS S3, Cloudinary, etc.
    return url;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStatus('Processing file...');
    playSound('major');
    try {
      let videoFile: Blob;
      let filename: string;
      if (selectedFile.type.startsWith('image/')) {
        setUploadStatus('Converting image to video...');
        videoFile = await convertImageToVideo(selectedFile);
        filename = `${selectedFile.name.split('.')[0]}_video.webm`;
      } else {
        videoFile = selectedFile;
        filename = selectedFile.name;
      }
      setUploadStatus('Generating public URL...');
      const publicUrl = await generatePublicUrl(videoFile, filename);
      setUploadStatus('Sending to device...');
      await mqtt.sendEyesVideo(publicUrl);
      setUploadStatus('Video sent successfully!');
      setIsPlaying(true);
      playSound('major');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('Upload failed. Please try again.');
      playSound('minor');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStopPlayback = async () => {
    try {
      await mqtt.sendEyesVideo('stop');
      setIsPlaying(false);
      setUploadStatus('Playback stopped.');
      playSound('major');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      setUploadStatus('Failed to stop playback.');
      playSound('minor');
    }
  };

  return (
    <div className="container mx-auto px-4 py-5 h-screen flex flex-col">
      <div className="flex flex-col h-full">
        {/* Header with Back Button */}
        <Card className="mb-6 flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  playSound('minor');
                  onBack();
                }}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">
                <DecryptedText 
                  text="Play Image/Video" 
                  animateOn="view" 
                  speed={50} 
                  maxIterations={7}
                  className="text-xl font-semibold"
                />
              </h1>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="mb-6 flex-shrink-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="media-upload" className="text-base font-medium">
                  <DecryptedText 
                    text="Upload Image or Video" 
                    animateOn="view" 
                    speed={50} 
                    maxIterations={7}
                    className="text-base font-medium"
                  />
                </Label>
                <Input
                  id="media-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="mt-2"
                  disabled={isUploading}
                />
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Selected:</strong> {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.type.startsWith('image/') ? 
                      'Image will be converted to a 5-second video' : 
                      'Video ready for upload'
                    }
                  </p>
                </div>
              )}
              
              {uploadStatus && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{uploadStatus}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isUploading ? 'Processing...' : 'Upload & Play'}
                </Button>
                
                <Button
                  onClick={handleStopPlayback}
                  disabled={!isPlaying}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop Playback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ExpressionControl() {
  const { playSound } = useSoundPlayer();
  const mqtt = useMQTT();
  const [isExprTracking, setIsExprTracking] = useState(true);
  const [isEyeTracking, setIsEyeTracking] = useState(true);
  const [activeExpression, setActiveExpression] = useState<number | null>(null);
  const [showMotorDialog, setShowMotorDialog] = useState(false);
  const [motorEnabled, setMotorEnabled] = useState(true);
  const [sillyMode, setSillyMode] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

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

  if (showMediaUpload) {
    return <MediaUploadPage onBack={() => setShowMediaUpload(false)} mqtt={mqtt} playSound={playSound} />;
  }

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

        {/* Play Image/Video Button */}
        <Card className="mb-6 flex-shrink-0">
          <CardContent className="p-4">
            <Button
              onClick={() => {
                playSound('minor');
                setShowMediaUpload(true);
              }}
              className="w-full h-12 text-lg font-medium"
              variant="outline"
            >
              <Play className="h-5 w-5 mr-2" />
              <DecryptedText 
                text="Play Image/Video" 
                animateOn="view" 
                speed={50} 
                maxIterations={7}
                className="font-medium"
              />
            </Button>
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