"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useBusiness } from "@/lib/business-store";
import { hashPin } from "@/lib/crypto";

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: "admin" | "cashier";
  active: boolean;
  business_id: string;
  created_at: string;
}

interface EmployeeContextType {
  employee: Employee | null;
  employees: Employee[];
  employeesLoaded: boolean;
  login: (pin: string) => Promise<Employee | null>;
  logout: () => void;
  loadEmployees: () => Promise<void>;
  saveEmployee: (e: Omit<Employee, "id" | "created_at">) => Promise<Employee | null>;
  deleteEmployee: (id: string) => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const { businessId } = useBusiness();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (!businessId) { setEmployeesLoaded(true); return; }
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    if (data) setEmployees(data as unknown as Employee[]);
    setEmployeesLoaded(true);
  }, [businessId]);

  useEffect(() => {
    loadEmployees();

    const stored = localStorage.getItem("employee");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (businessId && parsed.business_id === businessId) {
          setEmployee(parsed);
        } else {
          localStorage.removeItem("employee");
        }
      } catch {
        localStorage.removeItem("employee");
      }
    }
  }, [loadEmployees, businessId]);

  const login = useCallback(async (pin: string): Promise<Employee | null> => {
    const hashedPin = await hashPin(pin);
    const found = employees.find((e) => e.pin === hashedPin && e.active);
    if (found) {
      setEmployee(found);
      localStorage.setItem("employee", JSON.stringify(found));
      return found;
    }
    return null;
  }, [employees]);

  const logout = useCallback(() => {
    setEmployee(null);
    localStorage.removeItem("employee");
  }, []);

  const saveEmployee = useCallback(async (data: Omit<Employee, "id" | "created_at">): Promise<Employee | null> => {
    const hashedPin = await hashPin(data.pin);
    const payload = {
      ...data,
      pin: hashedPin,
      business_id: businessId,
      created_at: new Date().toISOString(),
    };
    const { data: inserted } = await supabase.from("employees").insert(payload).select().single();
    await loadEmployees();
    return inserted as unknown as Employee | null;
  }, [loadEmployees, businessId]);

  const deleteEmployee = useCallback(async (id: string) => {
    await supabase.from("employees").delete().eq("id", id);
    await loadEmployees();
  }, [loadEmployees]);

  const ctx = useMemo(() => ({
    employee, employees, employeesLoaded, login, logout, loadEmployees, saveEmployee, deleteEmployee
  }), [employee, employees, employeesLoaded, login, logout, loadEmployees, saveEmployee, deleteEmployee]);

  return (
    <EmployeeContext.Provider value={ctx}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error("useEmployee must be used within EmployeeProvider");
  return ctx;
}
