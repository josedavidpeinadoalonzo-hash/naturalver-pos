"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import type { Customer } from "@/lib/models";
import { Plus, Search, Users, Phone, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const bid = getTenantBusinessId();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", bid)
        .order("name");
      if (!error && data) {
        setCustomers(data as unknown as Customer[]);
        loadTotals(data as unknown as Customer[]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTotals(customers: Customer[]) {
    const result: Record<string, number> = {};
    for (const c of customers) {
      const { data } = await supabase
        .from("sales")
        .select("total_amount_usd")
        .eq("rif_cliente", c.id_card)
        .eq("document_type", "01");
      if (data) {
        result[c.id] = data.reduce((s, r) => s + Number(r.total_amount_usd || 0), 0);
      }
    }
    setTotals(result);
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.id_card?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link href="/clientes/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, RIF o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 opacity-30 mb-2" />
          <p className="text-sm">No hay clientes registrados</p>
          <Link href="/clientes/nuevo" className="mt-2 text-sm text-primary hover:underline">
            Registrar primer cliente
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.id_card && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> {c.id_card}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">${(totals[c.id] || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">total comprado</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
