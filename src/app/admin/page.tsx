'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  category: string;
}

export default function AdminPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState('');
  const [assetId, setAssetId] = useState('');
  const [category, setCategory] = useState('Mecânico');

  useEffect(() => {
    const savedAssets = JSON.parse(localStorage.getItem('vocalos_assets') || '[]');
    setAssets(savedAssets);
  }, []);

  const saveAssets = (newAssets: Asset[]) => {
    localStorage.setItem('vocalos_assets', JSON.stringify(newAssets));
    setAssets(newAssets);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !assetId) return;

    const newAsset: Asset = { id: assetId, name, category };
    const newAssets = [...assets, newAsset];
    saveAssets(newAssets);

    setName('');
    setAssetId('');
  };

  const handleDeleteAsset = (id: string) => {
    const newAssets = assets.filter(a => a.id !== id);
    saveAssets(newAssets);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Gestão de Inventário</h1>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetId">ID do Ativo (QR Code)</Label>
                  <Input
                    id="assetId"
                    placeholder="ex: BOMBA-01"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ativo</Label>
                  <Input
                    id="name"
                    placeholder="ex: Bomba de Recalque"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Mecânico">Mecânico</option>
                    <option value="Elétrico">Elétrico</option>
                    <option value="Eletrônico">Eletrônico</option>
                    <option value="Hidráulico">Hidráulico</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Ativo
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ativos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum ativo cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono">{asset.id}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{asset.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
