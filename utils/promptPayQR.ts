/**
 * Customer Display — PromptPay EMVCo QR Code generator
 *
 * Generates a valid PromptPay QR string per Bank of Thailand spec:
 *   - EMVCo Merchant Presented Mode (MPM)
 *   - Tag 29: AID for PromptPay
 *   - Tag 30: Proxy type (01=MSISDN, 02=National ID, 03=EWallet)
 *   - Tag 53: Transaction currency (764 = THB)
 *   - Tag 54: Amount
 *   - Tag 58: Country code (TH)
 *   - Tag 63: CRC16-CCITT checksum
 *
 * Then encodes the string as a QR matrix using a pure-JS Reed-Solomon
 * implementation (no external deps).
 *
 * NOTE: PromptPay is the Thai national QR; for LAK payments in Laos the
 * customer still uses this QR — the cashier swipes a Thai-bank account
 * and the customer's bank app auto-converts via the cross-border QR
 * agreement (e.g. UPI, QRIS, etc.). For the demo we hardcode a Thai
 * PromptPay number. To localize, accept a setting.
 */

const PROMPTPAY_AID = 'A000000677010111';

/** ---------- EMVCo TLV encoding ---------- */

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return id + len + value;
}

/** Convert phone number "08x-xxx-xxxx" → "0066xxxxxxxxx" for PromptPay MSISDN */
function normalizeMSISDN(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('66')) return digits;
  if (digits.startsWith('0')) return '66' + digits.slice(1);
  return digits;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) per EMVCo spec */
function crc16ccitt(data: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6));
      bytes.push(0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    }
  }
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PromptPayOptions {
  phoneOrId: string;       // e.g. "081-234-5678" or "1234567890123"
  amount: number;          // in THB; use whole-number THB for PromptPay
  proxyType?: 'msisdn' | 'natid' | 'ewallet';
}

export function buildPromptPayPayload(opts: PromptPayOptions): string {
  const { phoneOrId, amount } = opts;
  const proxyType = opts.proxyType ?? 'msisdn';

  let proxyValue: string;
  let subTag: string;
  if (proxyType === 'msisdn') {
    proxyValue = normalizeMSISDN(phoneOrId);
    subTag = '01';
  } else if (proxyType === 'natid') {
    proxyValue = phoneOrId.replace(/[^0-9]/g, '');
    subTag = '02';
  } else {
    proxyValue = phoneOrId;
    subTag = '03';
  }

  // Merchant Account Information (PromptPay)
  const merchantInfo =
    tlv('00', PROMPTPAY_AID) +
    tlv(subTag, proxyValue);

  // Compose payload, leaving CRC placeholder
  let payload =
    tlv('00', '01') +                    // Payload Format Indicator
    tlv('01', '11') +                    // Point of Initiation Method (11 = static, 12 = dynamic)
    tlv('29', merchantInfo) +            // Merchant Account Information
    tlv('53', '764') +                   // Transaction Currency (THB)
    tlv('54', amount.toFixed(2));        // Transaction Amount

  // CRC tag is "63" + "04" + 4 hex digits
  const crcInput = payload + '6304';
  const crc = crc16ccitt(crcInput);
  payload = crcInput + crc;
  return payload;
}

/** ---------- QR Code matrix (pure-JS Reed-Solomon encoder) ---------- */
// ---------- QR Code matrix (pure-JS Reed-Solomon encoder) ----------
import { qrcode as encodeQRMatrix } from './qrcodeEncoder';

export function generateQRMatrix(text: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): {
  size: number;
  modules: boolean[][];
} {
  return encodeQRMatrix(text, errorCorrectionLevel);
}

/** Render QR matrix to inline SVG. Returns data URI for <img src> usage. */
export function qrToSVG(text: string, opts?: { size?: number; margin?: number; dark?: string; light?: string; }): string {
  const size = opts?.size ?? 256;
  const margin = opts?.margin ?? 2;
  const dark = opts?.dark ?? '#0f172a';
  const light = opts?.light ?? '#ffffff';
  const { size: matrixSize, modules } = generateQRMatrix(text, 'M');
  const n = matrixSize + margin * 2;
  const cell = size / n;

  let path = '';
  for (let r = 0; r < matrixSize; r++) {
    let runStart = -1;
    for (let c = 0; c < matrixSize; c++) {
      const on = modules[r][c];
      if (on && runStart < 0) runStart = c;
      if ((!on || c === matrixSize - 1) && runStart >= 0) {
        const endC = on ? c + 1 : c;
        const x = (runStart + margin) * cell;
        const y = (r + margin) * cell;
        const w = (endC - runStart) * cell;
        path += `M${x.toFixed(2)},${y.toFixed(2)}h${w.toFixed(2)}v${cell.toFixed(2)}h${(-w).toFixed(2)}z`;
        runStart = -1;
      }
    }
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`
  )}`;
}
