import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Upload, AlertCircle, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Start camera stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setError(null);
    setIsStartingCamera(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError('Não foi possível acessar a câmera do dispositivo. Verifique as permissões ou envie um arquivo.');
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Scale canvas to max 800px width/height to optimize performance and localStorage
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;
    const maxDim = 800;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleSwitchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-amber-950 text-amber-50 rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-amber-800 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-amber-100 text-base">Tirar Foto do Vaso / Peça</h3>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1 rounded-full hover:bg-amber-900/60 text-amber-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-amber-800/50 shadow-inner">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {isStartingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-950/80 text-amber-200 text-xs space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Iniciando câmera...</span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-amber-950/95 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-amber-200 font-medium">{error}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold text-xs rounded-xl flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Carregar do Dispositivo</span>
                  </button>
                </div>
              )}

              {/* Camera viewfinder overlay grid lines */}
              {!error && !isStartingCamera && (
                <div className="absolute inset-0 border-2 border-amber-400/20 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-20 h-20 border border-amber-300/40 rounded-full"></div>
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="pt-1 flex items-center justify-between">
          {!capturedImage ? (
            <>
              {/* Toggle switch front/back camera */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={!!error}
                className="p-3 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded-2xl disabled:opacity-40 transition-colors"
                title="Alternar Câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!!error || isStartingCamera}
                className="flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-sm rounded-2xl shadow-lg disabled:opacity-40 transition-transform active:scale-95"
              >
                <Camera className="w-5 h-5" />
                <span>Capturar Foto</span>
              </button>

              {/* Choose File Fallback */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded-2xl transition-colors"
                title="Escolher do Arquivo/Galeria"
              >
                <Upload className="w-5 h-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center space-x-2 px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-200 font-bold text-xs rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Usar Esta Foto</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
