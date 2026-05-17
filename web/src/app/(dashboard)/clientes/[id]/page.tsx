"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import type { Customer, Debt } from "@/lib/models";
import { ArrowLeft, ShoppingBag, Phone, CreditCard, Mail, MapPin, Wallet, DollarSign, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils";
import { DebtPaymentModal } from "@/components/debts/debt-payment";

function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  async function loadCustomer() {
    try {
      const bid = getTenantBusinessId();
      const { data: c } = await supabase
        .from("customers")
        .select("*")
        .eq("id", params.id)
        .single();
      if (c) {
        const customerData = c as unknown as Customer & { credit_limit?: number; current_balance?: number };
        setCustomer(customerData);

        const { data: s } = await supabase
          .from("sales")
          .select("*")
          .eq("business_id", bid)
          .eq("rif_cliente", c.id_card)
          .eq("document_type", "01")
          .order("created_at", { ascending: false })
          .limit(50);
        setSales(s || []);

        const { data: d } = await supabase
          .from("debts")
          .select("*")
          .eq("business_id", bid)
          .or(`customer_id.eq.${params.id},customer_name.ilike.%${c.name}%`)
          .neq("status", "paid")
          .order("created_at", { ascending: false });
        setDebts((d as unknown as Debt[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const totalComprado = sales.reduce((sum, s) => sum + Number(s.total_amount_usd || 0), 0);
  const totalDeuda = debts.reduce((sum, d) => sum + Number(d.remaining_usd || 0), 0);
  const creditLimit = (customer as any)?.credit_limit || 0;
  const currentBalance = (customer as any)?.current_balance || 0;

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!customer) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cliente no encontrado</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">{customer.name}</h1>
      </div>

      <Card>
        <CardContent className="space-y-2">
          {customer.id_card && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{customer.id_card}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">Compras</span>
            </div>
            <p className="text-lg font-bold">{formatUSD(totalComprado)}</p>
            <p className="text-[10px] text-muted-foreground">{sales.length} transacciones</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-1.5 text-warning mb-1">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">Deuda</span>
            </div>
            <p className="text-lg font-bold text-warning">{formatUSD(totalDeuda)}</p>
            <p className="text-[10px] text-muted-foreground">{debts.length} pendientes</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-1.5 text-success mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">Crédito</span>
            </div>
            <p className="text-lg font-bold">{formatUSD(creditLimit)}</p>
            <p className="text-[10px] text-muted-foreground">disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Active debts */}
      {debts.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2 flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-warning" /> Deudas Activas
          </h2>
          <div className="space-y-2">
            {debts.map((d) => (
              <Card key={d.id} variant="flat" className="border border-warning/20">
                <CardContent className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{d.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Total: {formatUSD(d.total_amount_usd)} · Pagado: {formatUSD(d.paid_amount_usd)}
                      </p>
                      <div className="mt-1 w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-warning transition-all"
                          style={{ width: `${Math.min(100, (d.paid_amount_usd / d.total_amount_usd) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-danger">{formatUSD(d.remaining_usd)}</p>
                      <Button size="sm" variant="outline" onClick={() => setPayDebt(d)} className="mt-1 text-xs">
                        Cobrar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Purchase history */}
      <h2 className="font-semibold flex items-center gap-1.5">
        <History className="h-4 w-4 text-muted-foreground" /> Historial de Compras
      </h2>

      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin compras registradas</p>
      ) : (
        <div className="space-y-2">
          {sales.map((s, i) => (
            <Card key={s.id || i} variant="flat" className="border border-border">
              <CardContent className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{s.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.presentation_name} · {s.quantity}und · {s.payment_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">${Number(s.total_amount_usd).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {payDebt && (
        <DebtPaymentModal
          debt={payDebt}
          onClose={() => setPayDebt(null)}
          onPaid={loadCustomer}
        />
      )}
    </div>
  );
}

export default CustomerDetailPage;
