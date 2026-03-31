'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, ClipboardList, CheckCircle2, Clock, Settings, Plus, ArrowRight, Mic, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface OS {
  os_number?: string;
  asset_id: string;
  asset_name: string;
  problema: string;
  reparos: string[];
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: 'Aguardando Aprovação' | 'Sincronizado';
  created_at: string;
}

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<OS[]>([]);
  const [recentOS, setRecentOS] = useState<OS[]>([]);
  const [syncPercentage, setSyncPercentage] = useState(100);
  const [selectedOS, setSelectedOS] = useState<OS | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const allOS: OS[] = JSON.parse(localStorage.getItem('vocalos_history') || '[]');
    setDrafts(allOS.filter(os => os.status === 'Aguardando Aprovação'));
    setRecentOS(allOS.filter(os => os.status === 'Sincronizado').slice(0, 5));

    const total = allOS.length;
    const synced = allOS.filter(os => os.status === 'Sincronizado').length;
    setSyncPercentage(total === 0 ? 100 : Math.round((synced / total) * 100));
  }, []);

  const handleReview = (os: OS) => {
    setSelectedOS({ ...os });
    setIsReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedOS) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/erp-mock/register-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedOS),
      });

      const result = await response.json();

      if (result.success) {
        const history: OS[] = JSON.parse(localStorage.getItem('vocalos_history') || '[]');
        const updatedHistory = history.map(os =>
          (os.asset_id === selectedOS.asset_id && os.created_at === selectedOS.created_at)
            ? { ...selectedOS, status: 'Sincronizado', os_number: result.os_number } as OS
            : os
        );
        localStorage.setItem('vocalos_history', JSON.stringify(updatedHistory));

        setDrafts(updatedHistory.filter(os => os.status === 'Aguardando Aprovação'));
        setRecentOS(updatedHistory.filter(os => os.status === 'Sincronizado').slice(0, 5));

        const total = updatedHistory.length;
        const synced = updatedHistory.filter(os => os.status === 'Sincronizado').length;
        setSyncPercentage(Math.round((synced / total) * 100));
      }
    } catch (error) {
      console.error("Error syncing OS:", error);
    } finally {
      setIsSubmitting(false);
      setIsReviewOpen(false);
      setSelectedOS(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VocalOS</h1>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Total de OS hoje</p>
                <ClipboardList className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{(drafts.length + recentOS.length)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">Sincronização</p>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mb-2">{syncPercentage}%</p>
              <Progress value={syncPercentage} className="h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Status do Agente */}
        <div className="flex items-center gap-3 mb-8 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
          <div className="relative">
            <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
            <div className="absolute top-0 h-3 w-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <p className="text-sm font-medium text-emerald-800">Agente Vocal Pronto</p>
        </div>

        {/* Seção Em Memória (Drafts) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Em Memória
            </h2>
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              {drafts.length} aguardando
            </Badge>
          </div>

          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 italic">
                Nenhum rascunho pendente
              </div>
            ) : (
              drafts.map((os, i) => (
                <Card
                  key={i}
                  className="border-2 border-dashed border-amber-200 bg-amber-50/30 active:scale-[0.98] transition-transform cursor-pointer"
                  onClick={() => handleReview(os)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900">{os.asset_name}</h3>
                      <Badge className={
                        os.criticidade === 'Crítica' ? 'bg-red-500' :
                        os.criticidade === 'Alta' ? 'bg-orange-500' :
                        os.criticidade === 'Média' ? 'bg-amber-500' : 'bg-blue-500'
                      }>
                        {os.criticidade}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{os.problema}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      <span>Revisão IA Pendente</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Seção Recentes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Recentes
            </h2>
          </div>

          <div className="space-y-3">
            {recentOS.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-slate-400 border border-slate-100">
                Nenhuma OS sincronizada hoje
              </div>
            ) : (
              recentOS.map((os, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <ClipboardList className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{os.asset_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{os.os_number}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                    Sincronizado
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Botão Flutuante Iniciar OS */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-32px)]">
        <Link href="/scanner">
          <Button className="w-full h-14 rounded-2xl shadow-xl shadow-blue-200 text-lg font-bold gap-3 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-6 w-6" /> Iniciar Nova OS
          </Button>
        </Link>
      </div>

      {/* Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar OS Estruturada</DialogTitle>
            <DialogDescription>
              A IA estruturou seu relato. Verifique os dados abaixo antes de sincronizar com o ERP.
            </DialogDescription>
          </DialogHeader>

          {selectedOS && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Label className="text-xs text-slate-400 uppercase font-bold tracking-widest">Ativo</Label>
                <p className="font-bold text-slate-900 text-lg">{selectedOS.asset_name} ({selectedOS.asset_id})</p>
              </div>

              <div>
                <Label className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-2">Criticidade</Label>
                <div className="flex gap-2">
                  {(['Baixa', 'Média', 'Alta', 'Crítica'] as const).map((level) => (
                    <Badge
                      key={level}
                      variant={selectedOS.criticidade === level ? 'default' : 'outline'}
                      onClick={() => setSelectedOS({ ...selectedOS, criticidade: level })}
                      className={`cursor-pointer ${selectedOS.criticidade === level ?
                        (level === 'Crítica' ? 'bg-red-500 hover:bg-red-600' : level === 'Alta' ? 'bg-orange-500 hover:bg-orange-600' : level === 'Média' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600') :
                        ''}`}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">Problema Identificado</Label>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  value={selectedOS.problema}
                  onChange={(e) => setSelectedOS({ ...selectedOS, problema: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">Reparos Sugeridos</Label>
                <div className="space-y-2">
                  {selectedOS.reparos.map((reparo, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-white border rounded-lg overflow-hidden">
                      <input
                        className="flex-1 p-2 focus:outline-none"
                        value={reparo}
                        onChange={(e) => {
                          const newReparos = [...selectedOS.reparos];
                          newReparos[idx] = e.target.value;
                          setSelectedOS({ ...selectedOS, reparos: newReparos });
                        }}
                      />
                      <button
                        onClick={() => {
                          const newReparos = selectedOS.reparos.filter((_, i) => i !== idx);
                          setSelectedOS({ ...selectedOS, reparos: newReparos });
                        }}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 text-xs h-8"
                    onClick={() => setSelectedOS({ ...selectedOS, reparos: [...selectedOS.reparos, ""] })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Reparo
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)} disabled={isSubmitting} className="flex-1 rounded-xl">
              Editar
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl">
              {isSubmitting ? "Sincronizando..." : "Confirmar Envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
