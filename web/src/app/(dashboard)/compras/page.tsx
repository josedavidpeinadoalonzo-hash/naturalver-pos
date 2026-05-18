"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import { Plus, FileText, Download, Globe, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatUSD, formatBs, formatDate, cn } from "@/lib/utils";

type Tab = "local" | "colombia";

function ComprasPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("local");
  const [orders, setOrders] = useState<any[]>([]);
  const [colombiaOrders, setColombiaOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const bId = getTenantBusinessId();

    const { data: po } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("business_id", bId)
      .order("created_at", { ascending: false });
    if (po) setOrders(po);

    const { data: cp } = await supabase
      .from("colombia_purchases")
      .select("*")
      .eq("business_id", bId)
      .order("created_at", { ascending: false });
    if (cp) setColombiaOrders(cp);

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compras</h1>
        <Link href={tab === "local" ? "/compras/new" : "/compras/new?type=colombia"}>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {(["local", "colombia"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              tab === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            )}
          >
            {t === "local" ? (
              <><FileText className="h-4 w-4 inline mr-1" /> Proveedores Locales</>
            ) : (
              <><Globe className="h-4 w-4 inline mr-1" /> Compras Colombia</>
            )}
          </button>
        ))}
      </div>

      {tab === "local" ? (
        <LocalOrders orders={orders} loading={loading} onRefresh={loadData} />
      ) : (
        <ColombiaOrders orders={colombiaOrders} loading={loading} />
      )}
    </div>
  );
}

function LocalOrders({ orders, loading, onRefresh }: { orders: any[]; loading: boolean; onRefresh: () => void }) {
  if (loading) return <SkeletonList count={4} />;
  if (orders.length === 0) return (
    <div className="py-12 text-center">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">Sin órdenes de compra registradas</p>
      <Link href="/compras/new"><Button>Registrar primera compra</Button></Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} variant="elevated">
          <CardContent>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-semibold">{o.supplier_name}</p>
                <p className="text-xs text-muted-foreground">
                  Factura {o.invoice_number} · {formatDate(o.created_at)}
                </p>
              </div>
              <span className="text-sm font-bold">{formatUSD(Number(o.total_with_iva))}</span>
            </div>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span>Base: {formatUSD(Number(o.total_without_iva))}</span>
              <span>IVA: {formatUSD(Number(o.iva_total))}</span>
              <span>{o.items?.length || 0} productos</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ColombiaOrders({ orders, loading }: { orders: any[]; loading: boolean }) {
  if (loading) return <SkeletonList count={4} />;
  if (orders.length === 0) return (
    <div className="py-12 text-center">
      <Globe className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">Sin compras de Colombia registradas</p>
      <Link href="/compras/new?type=colombia"><Button>Registrar primera compra</Button></Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} variant="elevated">
          <CardContent>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-semibold">{o.supplier_name || "Proveedor Colombia"}</p>
                <p className="text-xs text-muted-foreground">
                  {o.invoice_number && `Factura ${o.invoice_number} · `}
                  {formatDate(o.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCOP(Number(o.total_cop))}</p>
                <p className="text-[10px] text-muted-foreground">~ {formatUSD(Number(o.total_usd))}</p>
              </div>
            </div>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span>{o.items?.length || 0} productos</span>
              {o.exchange_rate_cop_usd > 0 && <span>COP/USD: {Number(o.exchange_rate_cop_usd).toFixed(6)}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);
}

export default ComprasPage;
