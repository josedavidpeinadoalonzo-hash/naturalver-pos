export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const STORAGE_KEY_PREFIX = "pin_hash_";

export function getStoredPinHash(businessId: string, employeeId: string): string | null {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${businessId}_${employeeId}`);
}

export function setStoredPinHash(businessId: string, employeeId: string, hash: string): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${businessId}_${employeeId}`, hash);
}
