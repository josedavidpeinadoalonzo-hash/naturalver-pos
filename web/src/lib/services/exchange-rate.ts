const BCV_API = "https://ve.dolarapi.com/v1/dolares/oficial";
const BCV_KEY = "bcv_rate";
const COP_KEY = "cop_rate";
const COP_API = "https://ve.dolarapi.com/v1/cotizaciones/cop";

export interface ExchangeRates {
  bcv: number;
  cop: number;
}

export async function fetchBCVRate(): Promise<number> {
  try {
    const res = await fetch(BCV_API);
    const data = await res.json();
    const rate = data?.promedio || 0;
    if (rate > 0) {
      localStorage.setItem(BCV_KEY, String(rate));
    }
    return rate;
  } catch {
    const stored = localStorage.getItem(BCV_KEY);
    return stored ? Number(stored) : 0;
  }
}

export async function fetchCOPRate(): Promise<number> {
  try {
    const res = await fetch(COP_API);
    const data = await res.json();
    const rate = data?.promedio || data?.rate || 0;
    if (rate > 0) {
      localStorage.setItem(COP_KEY, String(rate));
    }
    return rate;
  } catch {
    const stored = localStorage.getItem(COP_KEY);
    return stored ? Number(stored) : 0;
  }
}

export function getStoredBCVRate(): number {
  const stored = localStorage.getItem(BCV_KEY);
  return stored ? Number(stored) : 0;
}

export function getStoredCOPRate(): number {
  const stored = localStorage.getItem(COP_KEY);
  return stored ? Number(stored) : 0;
}

export function setBCVRate(rate: number) {
  localStorage.setItem(BCV_KEY, String(rate));
}

export function setCOPRate(rate: number) {
  localStorage.setItem(COP_KEY, String(rate));
}

export function convertUSDtoVES(usdAmount: number): number {
  const rate = getStoredBCVRate();
  return rate > 0 ? usdAmount * rate : 0;
}

export function convertVKEStoUSD(vesAmount: number): number {
  const rate = getStoredBCVRate();
  return rate > 0 ? vesAmount / rate : 0;
}

export function convertUSDtoCOP(usdAmount: number): number {
  const rate = getStoredCOPRate();
  return rate > 0 ? usdAmount * rate : 0;
}

export function convertCOPtoUSD(copAmount: number): number {
  const rate = getStoredCOPRate();
  return rate > 0 ? copAmount / rate : 0;
}

export function convertVKEStoCOP(vesAmount: number): number {
  const usd = convertVKEStoUSD(vesAmount);
  return convertUSDtoCOP(usd);
}

export function convertCOPtoVES(copAmount: number): number {
  const usd = convertCOPtoUSD(copAmount);
  return convertUSDtoVES(usd);
}
