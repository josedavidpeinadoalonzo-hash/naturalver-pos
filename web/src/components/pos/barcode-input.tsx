"use client";

import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { Search, Camera } from "lucide-react";
import { playBeep } from "@/lib/beep";

interface BarcodeInputProps {
  onBarcode: (code: string) => void;
  onOpenScanner: () => void;
  onSearchChange?: (value: string) => void;
}

export function BarcodeInput({ onBarcode, onOpenScanner, onSearchChange }: BarcodeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCharTime = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(val: string) {
    setValue(val);
    onSearchChange?.(val);
    const now = Date.now();
    const isScanner = val.length > 0 && (lastCharTime.current === 0 || now - lastCharTime.current < 30);
    lastCharTime.current = now;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (val.length >= 4 && isScanner) {
      timerRef.current = setTimeout(() => {
        playBeep();
        onBarcode(val);
        setValue("");
        onSearchChange?.("");
        inputRef.current?.focus();
      }, 80);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      playBeep();
      onBarcode(value.trim());
      setValue("");
      onSearchChange?.("");
      inputRef.current?.focus();
    }
    if (e.key === "Escape") {
      setValue("");
      onSearchChange?.("");
      inputRef.current?.focus();
    }
  }

  function handleClick() {
    inputRef.current?.focus();
  }

  return (
    <div className="relative group" onClick={handleClick}>
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
        <Search className="h-4 w-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar producto por nombre o código..."
        className="w-full rounded-xl border-2 border-primary/30 bg-background pl-10 pr-12 py-3.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onOpenScanner(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        title="Escanear con cámara"
      >
        <Camera className="h-4 w-4" />
      </button>
    </div>
  );
}
