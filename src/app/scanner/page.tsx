'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, X, Check, Loader2, Camera, RefreshCw, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the QR Reader to avoid SSR issues
const QrReader = dynamic(() => import('react-qr-reader').then((mod) => mod.QrReader), { ssr: false });

export default function ScannerPage() {
  const router = useRouter();
  const [step, setStep] = useState<'SCAN' | 'IDENTIFIED' | 'RECORDING' | 'PROCESSING'>('SCAN');
  const [assetId, setAssetId] = useState<string | null>(null);
  const [assetInfo, setAssetInfo] = useState<{ name: string; category: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Simulation of QR Scan for testing purposes if no camera
  const simulateScan = () => {
    handleScan('BOMBA-01');
  };

  const handleScan = (data: string | null) => {
    if (data && step === 'SCAN') {
      setAssetId(data);
      // Look up asset in LocalStorage
      const assets = JSON.parse(localStorage.getItem('vocalos_assets') || '[]');
      const asset = assets.find((a: any) => a.id === data);

      if (asset) {
        setAssetInfo({ name: asset.name, category: asset.category });
        setStep('IDENTIFIED');
        // Provide haptic feedback if available
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(200);
        }
      } else {
        alert(`Ativo ${data} não cadastrado no inventário.`);
      }
    }
  };

  const startRecording = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn("Microphone access failed, using dummy stream for demo/testing", e);
        // Create a dummy audio stream if getUserMedia fails (common in headless/CI)
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = ctx.createMediaStreamDestination();
        stream = dest.stream;
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStep('RECORDING');
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStep('PROCESSING');
    }
  };

  const processAudio = async (blob: Blob) => {
    setStep('PROCESSING');

    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('assetInfo', JSON.stringify({ id: assetId, ...assetInfo }));

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Save to Drafts
        const history = JSON.parse(localStorage.getItem('vocalos_history') || '[]');
        const newDraft = {
          ...result,
          asset_id: assetId,
          asset_name: assetInfo?.name,
          status: 'Aguardando Aprovação',
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('vocalos_history', JSON.stringify([newDraft, ...history]));

        // Success feedback and redirect
        router.push('/');
      }
    } catch (err) {
      console.error("Erro no processamento:", err);
      alert("Houve um erro ao processar seu relato. Tente novamente.");
      setStep('IDENTIFIED');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <X className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">VocalOS Operação</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${assetId ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
            <p className="text-sm font-medium">{assetId ? 'Ativo Identificado' : 'Escaneando QR'}</p>
          </div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {step === 'SCAN' && (
          <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
            <QrReader
              onResult={(result, error) => {
                if (result) handleScan(result.getText());
              }}
              constraints={{ facingMode: 'environment' }}
              className="w-full h-full"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
            <div className="absolute inset-[60px] border-2 border-blue-400 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-md" />
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan" />
            </div>
            <button
                onClick={simulateScan}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold"
            >
              SIMULAR SCAN (BOMBA-01)
            </button>
          </div>
        )}

        {step === 'IDENTIFIED' && assetInfo && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
              <Check className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">{assetInfo.name}</h2>
              <p className="text-emerald-400 font-mono tracking-wider">{assetId}</p>
            </div>
            <p className="text-slate-400 max-w-[250px] mx-auto">
              Pressione o botão abaixo e relate o problema técnico.
            </p>
          </div>
        )}

        {step === 'RECORDING' && (
          <div className="text-center space-y-12 w-full max-w-xs">
            <div className="flex items-center justify-center gap-4 h-24">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-2 bg-blue-500 rounded-full animate-wave"
                  style={{
                    height: '40%',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-400 animate-pulse">Gravando Relato...</h2>
              <p className="text-slate-500 mt-2">Solte para finalizar</p>
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="text-center space-y-8">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Volume2 className="h-10 w-10 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Processando Áudio</h2>
              <p className="text-slate-500 mt-2">A IA está estruturando sua OS...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Controls */}
      <footer className="p-10 flex justify-center items-center">
        {step === 'SCAN' && (
          <p className="text-slate-500 text-sm font-medium">Aponte para o QR Code do ativo</p>
        )}

        {(step === 'IDENTIFIED' || step === 'RECORDING') && (
          <div className="relative">
            {step === 'RECORDING' && (
               <div className="absolute inset-0 -m-4 rounded-full bg-blue-500/20 animate-ping" />
            )}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isRecording ? 'bg-red-500 scale-110' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Mic className={`h-10 w-10 ${isRecording ? 'text-white' : 'text-white'}`} />
            </button>
          </div>
        )}

        {step === 'PROCESSING' && (
          <Button disabled className="w-full max-w-xs h-14 rounded-2xl bg-slate-800 border-slate-700">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analisando Relato
          </Button>
        )}
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
