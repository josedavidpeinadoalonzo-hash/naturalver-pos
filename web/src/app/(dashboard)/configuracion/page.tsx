"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { useBusiness } from "@/lib/business-store";
import { Settings, Save, MessageSquare, Users, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { useEmployee } from "@/lib/employee-store";

function ConfigPage() {
  const router = useRouter();
  const { employees, loadEmployees, saveEmployee, deleteEmployee } = useEmployee();
  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rifError, setRifError] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empPin, setEmpPin] = useState("");
  const [empRole, setEmpRole] = useState<"admin" | "cashier">("cashier");

  const { business } = useBusiness();

  useEffect(() => {
    if (business) loadConfig();
  }, [business]);

  async function loadConfig() {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase.from("company_config").select("*").eq("business_id", business.id).limit(1).single();
    if (data) {
      setName(data.name || "");
      setRif(data.rif || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
    }
    setLoading(false);
  }

  function validateRIF(value: string): boolean {
    const rifRegex = /^[VEJPGvejpg]-\d{5,9}(-\d)?$/;
    if (!rifRegex.test(value.trim())) {
      setRifError("Formato: V-12345678 o J-12345678-0");
      return false;
    }
    setRifError("");
    return true;
  }

  async function handleSave() {
    if (!business) return;
    if (!validateRIF(rif)) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("company_config").select("id").eq("business_id", business.id).limit(1).single();
      if (existing) {
        await supabase.from("company_config").update({ name, rif, address, phone, email }).eq("id", existing.id);
      } else {
        await supabase.from("company_config").insert({ business_id: business.id, name, rif, address, phone, email });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEmployee() {
    if (!empName.trim() || empPin.length !== 4) return;
    await saveEmployee({ name: empName.trim(), pin: empPin, role: empRole, active: true, business_id: business?.id || "" });
    setEmpName("");
    setEmpPin("");
    setShowEmployeeForm(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configuración</h1>

      {/* Company info */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="font-semibold">Información de la Empresa</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">RIF</label>
            <input type="text" value={rif}
              onChange={(e) => { setRif(e.target.value); setRifError(""); }}
              className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${rifError ? "border-danger" : "border-border"}`}
              placeholder="Ej: J-12345678-0" />
            {rifError && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {rifError}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Dirección Fiscal</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <Button fullWidth onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" /> Guardar Configuración
          </Button>
        </CardContent>
      </Card>

      {/* Employees */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Empleados
            </h2>
            <Button size="sm" onClick={() => setShowEmployeeForm(true)}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>

          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Sin empleados registrados</p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {emp.role === "admin" ? "Admin" : "Cajero"}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`¿Eliminar a ${emp.name}?`)) {
                        await deleteEmployee(emp.id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showEmployeeForm && (
            <div className="space-y-2 border-t border-border pt-3">
              <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)}
                placeholder="Nombre del empleado"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" value={empPin} onChange={(e) => setEmpPin(e.target.value.slice(0, 4))}
                placeholder="PIN (4 dígitos)" maxLength={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <div className="flex gap-2">
                {(["cashier", "admin"] as const).map((r) => (
                  <button key={r} onClick={() => setEmpRole(r)}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${empRole === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {r === "admin" ? "Admin" : "Cajero"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowEmployeeForm(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleAddEmployee}
                  disabled={!empName.trim() || empPin.length !== 4}>
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" fullWidth onClick={() => router.push("/configuracion/plantillas")}>
        <MessageSquare className="h-4 w-4" /> Gestionar Plantillas WhatsApp
      </Button>
    </div>
  );
}

export default ConfigPage;
