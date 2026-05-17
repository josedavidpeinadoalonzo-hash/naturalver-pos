export const ESC = "\x1b";
export const GS = "\x1d";

export const Commands = {
  RESET: `${ESC}@`,
  LINE_FEED: "\x0a",
  CUT: `${GS}V\x00`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${ESC}!\x10`,
  DOUBLE_WIDTH_ON: `${ESC}!\x20`,
  NORMAL_SIZE: `${ESC}!\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  QR_CODE: (data: string) => {
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return `${GS}(k\x04\x00\x31\x41\x32\x00${GS}(k${String.fromCharCode(pL, pH)}\x31\x43\x08${GS}(k\x03\x00\x31\x45\x30${data}`;
  },
  BARCODE: (code: string) => {
    return `${GS}k\x04${String.fromCharCode(code.length)}${code}`;
  },
};

export interface ReceiptLine {
  text: string;
  bold?: boolean;
  center?: boolean;
  double?: boolean;
  size?: "normal" | "double";
}

export function buildReceipt(lines: ReceiptLine[]): Uint8Array {
  const parts: string[] = [Commands.RESET];

  for (const line of lines) {
    if (line.center) parts.push(Commands.ALIGN_CENTER);
    else parts.push(Commands.ALIGN_LEFT);

    if (line.bold) parts.push(Commands.BOLD_ON);
    if (line.double || line.size === "double") {
      parts.push(Commands.DOUBLE_HEIGHT_ON + Commands.DOUBLE_WIDTH_ON);
    }

    parts.push(line.text);
    parts.push(Commands.LINE_FEED);

    if (line.bold) parts.push(Commands.BOLD_OFF);
    if (line.double || line.size === "double") {
      parts.push(Commands.NORMAL_SIZE);
    }
  }

  parts.push(Commands.LINE_FEED);
  parts.push(Commands.LINE_FEED);
  parts.push(Commands.CUT);

  const encoder = new TextEncoder();
  const totalLength = parts.reduce((sum, p) => sum + encoder.encode(p).length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of parts) {
    const encoded = encoder.encode(p);
    result.set(encoded, offset);
    offset += encoded.length;
  }
  return result;
}

export async function printViaWebUSB(data: Uint8Array): Promise<boolean> {
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [{ vendorId: 0x04b8 }],
    });
    await device.open();
    await device.claimInterface(0);
    await device.transferOut(1, data);
    await device.close();
    return true;
  } catch (err) {
    console.error("WebUSB print error:", err);
    return false;
  }
}

export async function printViaBluetooth(data: Uint8Array): Promise<boolean> {
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
    await characteristic.writeValue(data);
    server.disconnect();
    return true;
  } catch (err) {
    console.error("Bluetooth print error:", err);
    return false;
  }
}
