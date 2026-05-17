"use client";

import { useEffect } from "react";
import { EmployeeProvider, useEmployee } from "@/lib/employee-store";
import { useBusiness } from "@/lib/business-store";
import { EmployeeLogin } from "./employee-login";
import { BusinessLogin } from "./business-login";
import { setTenantBusinessId } from "@/lib/tenant-query";

function GateInner({ children }: { children: React.ReactNode }) {
  const { employee } = useEmployee();
  const { business, setBusiness } = useBusiness();

  useEffect(() => {
    if (business?.id) setTenantBusinessId(business.id);
  }, [business?.id]);

  if (!business) return <BusinessLogin />;
  if (!employee) return <EmployeeLogin />;

  return (
    <>
      <div className="fixed top-2 right-2 z-[80] flex items-center gap-2">
        <span className="hidden md:inline text-[10px] text-muted-foreground">
          {business.name} · {employee.name} ({employee.role === "admin" ? "Admin" : "Cajero"})
        </span>
        <button
          onClick={() => { setBusiness(null as any); localStorage.removeItem("business"); localStorage.removeItem("employee"); window.location.reload(); }}
          className="rounded-md bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Salir
        </button>
      </div>
      {children}
    </>
  );
}

export function EmployeeGate({ children }: { children: React.ReactNode }) {
  return (
    <EmployeeProvider>
      <GateInner>{children}</GateInner>
    </EmployeeProvider>
  );
}
