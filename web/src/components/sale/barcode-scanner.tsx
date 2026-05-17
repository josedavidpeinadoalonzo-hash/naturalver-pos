"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    if ("BarcodeDetector" in window) {
      detectorRef.current = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"] });
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanLoop();
        }
      } catch {
        setError("No se pudo acceder a la cámara");
      }
    }

    startCamera();

    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function scanLoop() {
    if (!scanningRef.current || !detectorRef.current || !videoRef.current) return;

    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      for (const code of codes) {
        if (code.rawValue) {
          scanningRef.current = false;
          onDetected(code.rawValue);
          return;
        }
      }
    } catch {}

    if (scanningRef.current) {
      requestAnimationFrame(scanLoop);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="relative flex-1">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-48 w-48 rounded-xl border-2 border-white/60" />
        </div>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <Camera className="mx-auto h-10 w-10 mb-3 opacity-60" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-white/60">
          Apunta al código de barras
        </p>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}
