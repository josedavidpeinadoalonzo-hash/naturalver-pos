"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils";
import {
  generateLibroVentasXML,
  generateLibroComprasXML,
  getYearMonth,
  type SaleRow,
  type PurchaseOrderRow,
  type CompanyData,
} from "@/lib/reportez/generator";
import { FileText, Download, ShoppingCart, Package, Loader2 } from "lucide-react";

export default function ReporteZPage() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const yearMonth = `${year}${String(month + 1).padStart(2, "0")}`;

  function getMonthRange() {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 1).toISOString();
    return { start, end };
  }

  async function loadData() {
    setLoading(true);
    setError("");
    setLoaded(false);
    const bId = getTenantBusinessId();
    if (!bId) return;

    try {
      const { start, end } = getMonthRange();

      const [cfgRes, salesRes, poRes] = await Promise.all([
        supabase
          .from("company_config")
          .select("rif, name, address, phone, email")
          .eq("business_id", bId)
          .maybeSingle(),
        supabase
          .from("sales")
          .select("*")
          .eq("business_id", bId)
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: true }),
        supabase
          .from("purchase_orders")
          .select("*")
          .eq("business_id", bId)
          .gte("invoice_date", start)
          .lt("invoice_date", end)
          .order("invoice_date", { ascending: true }),
      ]);

      if (cfgRes.data) {
        setCompany(cfgRes.data as CompanyData);
      } else {
        setError("Configura la empresa en Configuración primero (RIF, nombre)");
      }

      setSales((salesRes.data || []) as SaleRow[]);
      setPurchases((poRes.data || []) as PurchaseOrderRow[]);
      setLoaded(true);
    } catch (e) {
      setError("Error al cargar datos");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [year, month]);

  function downloadXML(xml: string, filename: string) {
    const bom = "\uFEFF";
    const blob = new Blob([bom + xml], { type: "application/xml;charset=ISO-8859-1" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadVentas() {
    if (!company) return;
    const xml = generateLibroVentasXML(company, yearMonth, sales);
    const rifClean = (company.rif || "N").replace(/[^A-Za-z0-9-]/g, "");
    downloadXML(xml, `${rifClean}_${yearMonth}_LV.XML`);
  }

  function handleDownloadCompras() {
    if (!company) return;
    const xml = generateLibroComprasXML(company, yearMonth, purchases);
    const rifClean = (company.rif || "N").replace(/[^A-Za-z0-9-]/g, "");
    downloadXML(xml, `${rifClean}_${yearMonth}_LC.XML`);
  }

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const totalVentasUSD = sales.reduce((s, v) => s + Number(v.total_amount_usd || 0), 0);
  const totalComprasUSD = purchases.reduce((s, p) => s + Number(p.total_with_iva || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5" />
        <h1 className="text-xl font-bold">Reporte Z — SENIAT</h1>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Cargando...
        </div>
      )}

      {loaded && !error && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ShoppingCart className="h-4 w-4" />
                Ventas
              </div>
              <p className="text-2xl font-bold">{formatUSD(totalVentasUSD)}</p>
              <p className="text-xs text-muted-foreground">
                {sales.length} transacciones
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                Compras
              </div>
              <p className="text-2xl font-bold">{formatUSD(totalComprasUSD)}</p>
              <p className="text-xs text-muted-foreground">
                {purchases.length} facturas
              </p>
            </div>
          </div>

          {/* Download buttons */}
          <div className="space-y-2">
            <Button
              fullWidth
              size="lg"
              onClick={handleDownloadVentas}
              disabled={sales.length === 0}
            >
              <Download className="h-4 w-4" />
              Descargar Libro de Ventas XML
            </Button>
            <Button
              fullWidth
              variant={purchases.length > 0 ? "primary" : "outline"}
              size="lg"
              onClick={handleDownloadCompras}
              disabled={purchases.length === 0}
            >
              <Download className="h-4 w-4" />
              Descargar Libro de Compras XML
            </Button>
          </div>

          {/* Sales table preview */}
          {sales.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground">
                Vista Previa — Ventas ({sales.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/10 border-b border-border">
                      <th className="px-2 py-1.5 text-left">Factura</th>
                      <th className="px-2 py-1.5 text-left">Cliente</th>
                      <th className="px-2 py-1.5 text-left">RIF</th>
                      <th className="px-2 py-1.5 text-right">Base</th>
                      <th className="px-2 py-1.5 text-right">IVA</th>
                      <th className="px-2 py-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5 font-mono">
                          {s.invoice_number || s.id.slice(0, 8)}
                        </td>
                        <td className="px-2 py-1.5">
                          {s.customer_name || "CONSUMIDOR FINAL"}
                        </td>
                        <td className="px-2 py-1.5 font-mono">
                          {s.rif_cliente || "V-99999999"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {s.taxable_amount ? formatUSD(Number(s.taxable_amount)) : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-right text-warning">
                          {s.iva_amount ? formatUSD(Number(s.iva_amount)) : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">
                          {formatUSD(Number(s.total_amount_usd))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sales.length === 0 && purchases.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay ventas ni compras en este período.
            </p>
          )}
        </>
      )}
    </div>
  );
}
