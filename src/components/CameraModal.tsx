import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, Upload, AlertCircle, SwitchCamera } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

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

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Capturar Foto do Produto / Peça"
      description="Use a câmera ou selecione um arquivo de imagem"
      size="lg"
    >
      <div className="space-y-4 font-brand-sans">
        {/* Viewport Area */}
        <div className="relative bg-[#292724] rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-[#E7D5BE] shadow-inner">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Foto capturada da peça"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#292724]/80 text-[#FAF6EF] text-xs space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#B85C38]" />
                  <span>Iniciando câmera...</span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#292724]/95 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-[#B85C38]" />
                  <p className="text-xs text-[#FAF6EF] font-medium">{error}</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="primary"
                    size="sm"
                    icon={Upload}
                  >
                    Carregar do Dispositivo
                  </Button>
                </div>
              )}

              {/* Camera viewfinder overlay grid lines */}
              {!error && !isStartingCamera && (
                <div className="absolute inset-0 border-2 border-[#E7D5BE]/30 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-20 h-20 border border-[#E7D5BE]/50 rounded-full"></div>
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E7D5BE]">
          {!capturedImage ? (
            <>
              <Button
                type="button"
                onClick={handleSwitchCamera}
                disabled={!!error}
                variant="secondary"
                size="sm"
                icon={SwitchCamera}
                ariaLabel="Alternar câmera frontal e traseira"
              />

              <Button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!!error || isStartingCamera}
                variant="primary"
                size="md"
                icon={Camera}
              >
                Capturar Foto
              </Button>

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                icon={Upload}
                ariaLabel="Carregar foto do dispositivo"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                id="camera-file-upload"
              />
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleRetake}
                variant="secondary"
                size="sm"
                icon={RefreshCw}
              >
                Tirar Outra
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                variant="primary"
                size="sm"
                icon={Check}
              >
                Usar Esta Foto
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
