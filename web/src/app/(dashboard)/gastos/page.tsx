"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import type { Expense, ExpenseCategory } from "@/lib/models";
import { Plus, Trash2 } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "transporte", label: "Transporte", emoji: "🚚" },
  { value: "mercancia", label: "Mercancía", emoji: "📦" },
  { value: "servicios", label: "Servicios", emoji: "💡" },
  { value: "alquiler", label: "Alquiler", emoji: "🏠" },
  { value: "empaque", label: "Empaque", emoji: "📋" },
  { value: "otro", label: "Otro", emoji: "📌" },
];

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    const bId = getTenantBusinessId();
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("business_id", bId)
      .order("created_at", { ascending: false });
    if (data) setExpenses(data as unknown as Expense[]);
    setLoading(false);
  }

  const todayTotal = expenses
    .filter((e) => e.created_at?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((s, e) => s + Number(e.amount_usd), 0);

  const monthTotal = expenses
    .filter((e) => e.created_at?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, e) => s + Number(e.amount_usd), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gastos</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" accentColor="#C62828">
          <CardContent>
            <span className="text-xs text-muted-foreground">Hoy</span>
            <p className="text-xl font-bold text-danger">{formatUSD(todayTotal)}</p>
          </CardContent>
        </Card>
        <Card variant="elevated" accentColor="#B26A00">
          <CardContent>
            <span className="text-xs text-muted-foreground">Este Mes</span>
            <p className="text-xl font-bold text-warning">{formatUSD(monthTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <ExpenseForm onSave={() => { setShowForm(false); loadExpenses(); }} />
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
      ) : expenses.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No hay gastos registrados</div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <Card key={exp.id} variant="flat" className="border border-border">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {CATEGORIES.find((c) => c.value === exp.category)?.emoji || "📌"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{exp.description}</p>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORIES.find((c) => c.value === exp.category)?.label}
                        {" · "}
                        {new Date(exp.created_at).toLocaleDateString("es-VE")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{formatUSD(Number(exp.amount_usd))}</span>
                    <button
                      onClick={async () => {
                        if (confirm("¿Eliminar este gasto?")) {
                          await supabase.from("expenses").delete().eq("id", exp.id);
                          loadExpenses();
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseForm({ onSave }: { onSave: () => void }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("otro");
  const [amountUSD, setAmountUSD] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!description.trim() || !amountUSD) return;
    setSaving(true);
    await tenantInsert("expenses", {
      description: description.trim(),
      category,
      amount_usd: Number(amountUSD),
      amount_bs: 0,
      exchange_rate: Number(localStorage.getItem("bcv_rate") || "0"),
      payment_type: "cash",
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    onSave();
  }

  return (
    <Card variant="elevated">
      <CardContent className="space-y-3">
        <input type="text" placeholder="Descripción del gasto" value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c.value}
              onClick={() => setCategory(c.value)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm ${category === c.value ? "border-primary bg-primary/10" : "border-border"}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Monto USD</label>
          <input type="number" step="0.01" min="0" value={amountUSD}
            onChange={(e) => setAmountUSD(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <Button fullWidth onClick={handleSave} loading={saving}>Guardar Gasto</Button>
      </CardContent>
    </Card>
  );
}

export default ExpensesPage;
