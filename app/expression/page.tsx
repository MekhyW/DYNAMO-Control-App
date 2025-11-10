"use client"

import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ScanFace, Sparkles, Play, ArrowLeft } from 'lucide-react';
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
      const maxSizeInBytes = 30 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setUploadStatus(`File size exceeds 30MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        setSelectedFile(null);
        event.target.value = '';
        playSound('minor');
        return;
      }
      const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      const supportedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/m4v', 'video/3gp', 'video/ogv'];
      const isValidImage = supportedImageTypes.includes(file.type);
      const isValidVideo = supportedVideoTypes.includes(file.type);
      if (!isValidImage && !isValidVideo) {
        setUploadStatus(`Unsupported file type: ${file.type}. Please select a supported image or video file.`);
        setSelectedFile(null);
        event.target.value = '';
        playSound('minor');
        return;
      }
      if (isValidVideo) {
        const fileName = file.name.toLowerCase();
        const hasValidExtension = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'].some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
          setUploadStatus('Video file must have a valid extension (.mp4, .avi, .mov, etc.)');
          setSelectedFile(null);
          event.target.value = '';
          playSound('minor');
          return;
        }
      }
      setSelectedFile(file);
      setUploadStatus('');
      playSound('major');
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
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) { chunks.push(event.data); }
        };
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/mp4' });
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
    const { upload } = await import('@vercel/blob/client');
    try {
      const blob = await upload(filename, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({fileName: filename, fileSize: file.size, fileType: file.type,}),
      });
      return blob.url;
    } catch (error) {
      console.error('Client-side upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        filename = `${selectedFile.name.split('.')[0]}_video.mp4`;
      } else {
        videoFile = selectedFile;
        filename = selectedFile.name;
      }
      setUploadStatus('Processing video...');
      const publicUrl = await generatePublicUrl(videoFile, filename);
      setUploadStatus('Sending to fursuit...');
      await mqtt.sendEyesVideo(publicUrl);
      setUploadStatus('Video sent to fursuit!');
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
                      'Image will be converted to video' : 
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
      console.error('Failed to toggle automatic face expression:', error);
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
        console.error('Failed to disable automatic face expression:', error);
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
        await mqtt.toggleMotors(false);
      } catch (error) {
        console.error('Failed to toggle motors:', error);
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
                      text="Automatic Face Expression" 
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
                      text="Automatic Eye Movement" 
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
                      text="Motors (Motor Control)" 
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
                  <Sparkles className={cn(
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
                  await mqtt.toggleMotors(true);
                } catch (error) {
                  console.error('Failed to enable motors:', error);
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