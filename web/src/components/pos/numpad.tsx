"use client";

interface NumpadProps {
  quantity: number;
  onChange: (qty: number) => void;
}

export function Numpad({ quantity, onChange }: NumpadProps) {
  function append(d: string) {
    const next = Number(String(quantity) + d);
    if (next <= 999) onChange(next);
  }

  function clear() {
    onChange(1);
  }

  function backspace() {
    const s = String(quantity);
    if (s.length <= 1) { onChange(1); return; }
    onChange(Number(s.slice(0, -1)));
  }

  function preset(n: number) {
    onChange(n);
  }

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-3 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Cant.</span>
        <span className="text-2xl font-bold tabular-nums font-mono">{quantity}</span>
        <button onClick={clear} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          Reset
        </button>
      </div>

      <div className="flex gap-1.5">
        {[1, 3, 5, 10, 20].map((n) => (
          <button
            key={n}
            onClick={() => preset(n)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all active:scale-90 ${
              quantity === n
                ? "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-md"
                : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-border/40"
            }`}
          >
            x{n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {keys.flat().map((k) => (
          <button
            key={k}
            onClick={() => {
              if (k === "C") clear();
              else if (k === "⌫") backspace();
              else append(k);
            }}
            className="flex h-14 items-center justify-center rounded-xl bg-muted/15 text-xl font-bold hover:bg-muted/30 active:scale-95 active:shadow-inner transition-all shadow-sm border border-border/30"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
