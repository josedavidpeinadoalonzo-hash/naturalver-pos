"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const bid = getTenantBusinessId();
      await supabase.from("customers").insert({
        business_id: bid,
        name: name.trim(),
        id_card: idCard.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      router.push("/clientes");
    } catch (err: any) {
      setError(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">Nuevo Cliente</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">RIF / Cédula</label>
            <input type="text" value={idCard} onChange={(e) => setIdCard(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="J-XXXXXXXX-X" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0412-1234567" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="cliente@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Dirección</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Dirección del cliente" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} loading={saving} disabled={!name.trim()}>
          <Save className="h-4 w-4" /> Guardar Cliente
        </Button>
      </div>
    </div>
  );
}

export default NewCustomerPage;
