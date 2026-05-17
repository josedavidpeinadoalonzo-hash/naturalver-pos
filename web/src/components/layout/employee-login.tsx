"use client";

import { useState } from "react";
import { useEmployee } from "@/lib/employee-store";
import { useBusiness } from "@/lib/business-store";
import { User, Shield, ArrowLeft, Loader2 } from "lucide-react";

export function EmployeeLogin() {
  const { login, employees, employeesLoaded, saveEmployee } = useEmployee();
  const { business, setBusiness } = useBusiness();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  if (!employeesLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      const found = login(next);
      if (!found) {
        setError("PIN incorrecto");
        setPin("");
      }
    }
  }

  function handleDelete() {
    setPin(pin.slice(0, -1));
    setError("");
  }

  async function handleSetup() {
    if (!setupName.trim() || setupPin.length !== 4) return;
    setSetupLoading(true);
    const emp = await saveEmployee({ name: setupName.trim(), pin: setupPin, role: "admin", active: true, business_id: business?.id || "" });
    if (emp) {
      localStorage.setItem("employee", JSON.stringify(emp));
      window.location.reload();
    }
    setSetupLoading(false);
  }

  if (employees.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-1">{business?.name || "NaturalVer's"}</h1>
        <p className="text-sm text-muted-foreground mb-6">Configuraci&oacute;n inicial</p>

        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
            placeholder="Nombre del administrador"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={setupPin}
            onChange={(e) => setSetupPin(e.target.value.slice(0, 4))}
            placeholder="PIN de 4 d&iacute;gitos"
            maxLength={4}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSetup}
            disabled={!setupName.trim() || setupPin.length !== 4 || setupLoading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {setupLoading ? "Creando..." : "Crear y Entrar"}
          </button>
        </div>

        <button
          onClick={() => { setBusiness(null as any); localStorage.removeItem("business"); window.location.reload(); }}
          className="mt-6 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Cambiar negocio
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <User className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold mb-1">{business?.name || "NaturalVer's"}</h1>
      <p className="text-sm text-muted-foreground mb-8">Ingresa tu PIN para continuar</p>

      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all ${
              pin.length > i
                ? "border-primary bg-primary"
                : "border-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-danger mb-4">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-3 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="flex h-16 items-center justify-center rounded-xl bg-muted/20 text-xl font-bold hover:bg-muted/40 active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setPin(pin)}
          className="flex h-16 items-center justify-center rounded-xl text-xs text-muted-foreground hover:bg-muted/20"
        >
          {pin.replace(/./g, "•")}
        </button>
        <button
          onClick={() => handleDigit("0")}
          className="flex h-16 items-center justify-center rounded-xl bg-muted/20 text-xl font-bold hover:bg-muted/40 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="flex h-16 items-center justify-center rounded-xl text-sm text-muted-foreground hover:bg-muted/20"
        >
          ⌫
        </button>
      </div>

      <button
        onClick={() => { setBusiness(null as any); localStorage.removeItem("business"); window.location.reload(); }}
        className="mt-8 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Cambiar negocio
      </button>
    </div>
  );
}
