"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import type { MessageTemplate } from "@/lib/models";
import { ArrowLeft, Plus, Trash2, MessageSquare, Pencil, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES: Record<string, string> = {
  payment: "Pago",
  location: "Ubicación",
  greeting: "Saludo",
  other: "Otro",
};

function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const bId = getTenantBusinessId();
    const { data } = await supabase.from("templates").select("*").eq("business_id", bId).order("created_at");
    if (data) setTemplates(data as unknown as MessageTemplate[]);
  }

  function handleEdit(t: MessageTemplate) {
    setEditingTemplate(t);
    setShowForm(true);
  }

  function handleNew() {
    setEditingTemplate(null);
    setShowForm(true);
  }

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">Plantillas WhatsApp</h1>
      </div>

      <Button size="sm" onClick={handleNew}>
        <Plus className="h-4 w-4" /> Nueva Plantilla
      </Button>

      {templates.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No hay plantillas</div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} variant="elevated">
              <CardContent>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{t.title}</h3>
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                      t.category === "payment" ? "bg-primary/10 text-primary" :
                      t.category === "location" ? "bg-accent/20 text-warning" :
                      t.category === "greeting" ? "bg-success/10 text-success" :
                      "bg-muted/20 text-muted-foreground"
                    )}>
                      {CATEGORIES[t.category] || t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => handleCopy(t.content)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-card/50"
                      title="Copiar">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleEdit(t)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-card/50"
                      title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={async () => {
                      if (confirm("¿Eliminar plantilla?")) {
                        await supabase.from("templates").delete().eq("id", t.id);
                        loadTemplates();
                      }
                    }} className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-card/50"
                      title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onSave={() => { setShowForm(false); setEditingTemplate(null); loadTemplates(); }}
          onClose={() => { setShowForm(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
}

function TemplateForm({ template, onSave, onClose }: {
  template: MessageTemplate | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(template?.title || "");
  const [content, setContent] = useState(template?.content || "");
  const [category, setCategory] = useState<"payment" | "location" | "greeting" | "other">(
    (template?.category as any) || "other"
  );
  const [saving, setSaving] = useState(false);
  const isEdit = !!template;

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
    };

    if (isEdit && template) {
      await supabase.from("templates").update(payload).eq("id", template.id);
    } else {
      const bId = getTenantBusinessId();
      await supabase.from("templates").insert({ ...payload, business_id: bId, created_at: new Date().toISOString() });
    }

    setSaving(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-6 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{isEdit ? "Editar Plantilla" : "Nueva Plantilla"}</h2>
        <div className="space-y-3">
          <input type="text" placeholder="Título" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-2 flex-wrap">
            {(["payment", "location", "greeting", "other"] as const).map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`rounded-lg border px-3 py-1 text-sm ${category === c ? "border-primary bg-primary/10" : "border-border"}`}>
                {CATEGORIES[c]}
              </button>
            ))}
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
            placeholder="Contenido del mensaje..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              <MessageSquare className="h-4 w-4" /> {isEdit ? "Guardar Cambios" : "Crear Plantilla"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplatesPage;
