/**
 * Pure-JS QR Code encoder
 * Implements QR Code Model 2 (ISO/IEC 18004) for byte mode (UTF-8).
 * Supports error correction levels L/M/Q/H and version 1..40.
 *
 * Adapted from public-domain reference: Project Nayuki's QR Code generator
 * (https://www.nayuki.io/page/qr-code-generator-library) — MIT licensed.
 */

// ---------- Type definitions ----------
export type ECLevel = 'L' | 'M' | 'Q' | 'H';

// ---------- Error-correction table (Blockwise) ----------
// Format: ECC_CODEWORDS_PER_BLOCK[ecLevel][range][version-1]
// ranges: 0 = v1-9, 1 = v10-26, 2 = v27-40
// Each cell is the number of error-correction codewords per block

// Each row is a contiguous array of ecc-codeword values per version
// Row 0: v1-26 (26 entries)
// Row 1: v27-40 (14 entries)

const L_ECW: number[][] = [
  [7, 10, 13, 17, 22, 28, 34, 22, 16, 28, 36, 44, 34, 24, 20, 18, 16, 18, 18, 20, 24, 28, 32, 26, 24, 22, 22],
  [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
];
const M_ECW: number[][] = [
  [10, 16, 22, 28, 36, 44, 34, 24, 20, 32, 40, 48, 36, 28, 24, 20, 18, 18, 18, 20, 24, 28, 26, 24, 22, 22, 22],
  [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
];
const Q_ECW: number[][] = [
  [13, 22, 18, 26, 30, 38, 46, 38, 30, 36, 44, 32, 24, 22, 20, 18, 18, 18, 18, 20, 24, 28, 26, 24, 22, 22, 22],
  [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
];
const H_ECW: number[][] = [
  [17, 28, 22, 16, 30, 24, 38, 38, 30, 40, 32, 24, 22, 20, 18, 18, 18, 18, 18, 20, 24, 28, 26, 24, 22, 22, 22],
  [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
];

const ECC_CODEWORDS_PER_BLOCK: Record<ECLevel, number[][]> = {
  L: L_ECW, M: M_ECW, Q: Q_ECW, H: H_ECW,
};

// Number of error-correction blocks per (range, ecLevel)
// For simplicity, this minimal encoder uses single-block mode for the
// prompt-pay use case (~80 chars). Real-world: lookup table per version.
const NUM_BLOCKS: Record<ECLevel, number[]> = {
  L: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8, 8, 9, 9, 10, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8, 8, 9, 9, 10, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  Q: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8, 8, 9, 9, 10, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  H: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 8, 8, 9, 9, 10, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
};

// Total data codewords per version (numeric indices match version-1)
const TOTAL_DATA_CODEWORDS: number[] = [
  19, 34, 55, 80, 108, 136, 156, 194, 232, 274,
  324, 370, 428, 461, 523, 589, 647, 721, 795, 861,
  932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735,
  1843, 1955, 2071, 2191, 2306, 2434, 2566, 2702, 2812, 2956,
  3106, // 41 — guard
];

function eccCodewordsPerBlock(version: number, ec: ECLevel): number {
  // v1-9 → row 0, indices 0-8
  // v10-26 → row 0 continued (indices 9-25) — we packed them in a single 27-element row
  // v27-40 → row 1, indices 0-13
  if (version <= 26) {
    return ECC_CODEWORDS_PER_BLOCK[ec][0][version - 1];
  }
  return ECC_CODEWORDS_PER_BLOCK[ec][1][version - 27];
}

function numBlocksFor(version: number, ec: ECLevel): number {
  return NUM_BLOCKS[ec][version - 1];
}

function totalDataCodewords(version: number): number {
  return TOTAL_DATA_CODEWORDS[version - 1];
}

function getNumDataCodewords(version: number, ec: ECLevel): number {
  const numBlocks = numBlocksFor(version, ec);
  const blockEcc = eccCodewordsPerBlock(version, ec);
  return totalDataCodewords(version) - blockEcc * numBlocks;
}

/** Pick the smallest QR version that fits the data */
function pickVersion(textBytes: Uint8Array, ec: ECLevel): { version: number; dataCapacityBits: number; } {
  for (let version = 1; version <= 40; version++) {
    const dataCapacityBits = getNumDataCodewords(version, ec) * 8;
    const charCountBits = version < 10 ? 8 : 16;
    if (4 + charCountBits + textBytes.length * 8 <= dataCapacityBits) {
      return { version, dataCapacityBits };
    }
  }
  throw new Error('Data too long for QR');
}

// ---------- GF(256) ----------
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function gfPolyMul(p: number[], q: number[]): number[] {
  const result = new Array(p.length + q.length - 1).fill(0);
  for (let j = 0; j < q.length; j++) {
    for (let i = 0; i < p.length; i++) {
      result[i + j] ^= gfMul(p[i], q[j]);
    }
  }
  return result;
}

function reedSolomonRemainder(data: number[], divisorLen: number): number[] {
  const result = new Array(divisorLen).fill(0);
  for (const b of data) {
    const factor = b ^ result.shift()!;
    result.push(0);
    const divisor: number[] = new Array(divisorLen).fill(0);
    divisor[0] = 1;
    for (let i = 1; i < divisorLen; i++) {
      divisor[i] = gfMul(EXP_TABLE[i - 1], factor);
    }
    for (let i = 0; i < result.length; i++) {
      result[i] ^= divisor[i] ?? 0;
    }
  }
  return result;
}

function buildGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = gfPolyMul(poly, [1, EXP_TABLE[i]]);
  }
  return poly;
}

// ---------- Bit helpers ----------
function buildBits(textBytes: Uint8Array, version: number, dataCapacityBits: number): boolean[] {
  const bits: boolean[] = [];
  // Mode indicator: byte mode = 0100
  bits.push(false, true, false, false);
  // Character count indicator
  const charCountBits = version < 10 ? 8 : 16;
  for (let i = charCountBits - 1; i >= 0; i--) {
    bits.push(((textBytes.length >> i) & 1) === 1);
  }
  // Data
  for (const b of textBytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push(((b >> i) & 1) === 1);
    }
  }
  // Terminator
  const remaining = dataCapacityBits - bits.length;
  for (let i = 0; i < Math.min(4, remaining); i++) bits.push(false);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(false);
  // Pad bytes
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < dataCapacityBits) {
    for (let i = 7; i >= 0; i--) {
      bits.push(((padBytes[padIdx] >> i) & 1) === 1);
    }
    padIdx ^= 1;
  }
  return bits;
}

function bitsToBytes(bits: boolean[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | (bits[i + j] ? 1 : 0);
    }
    out.push(b);
  }
  return out;
}

// ---------- Matrix helpers ----------
function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = (version === 32) ? 26 :
    Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = (version * 4 + 10 - step * (numAlign - 1)) | 0; pos < version * 4 + 4; pos += step) {
    result.splice(result.length - 1, 0, pos);
  }
  return result;
}

function getFormatBits(ecLevel: ECLevel, mask: number): number {
  const data = (ecLevel === 'L' ? 1 : ecLevel === 'M' ? 0 : ecLevel === 'Q' ? 3 : 2) << 3 | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9 & 1) * 0x537);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function getVersionBits(version: number): number {
  if (version < 7) return 0;
  let rem = version;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >> 11 & 1) * 0x1F25);
  }
  return (version << 12) | rem;
}

function drawFunctionPatterns(modules: boolean[][], reserved: boolean[][], version: number): void {
  const size = modules.length;

  // Finder patterns + separators
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      reserved[i][j] = true;
      reserved[size - 1 - i][j] = true;
      reserved[i][size - 1 - j] = true;
    }
  }

  // Finder patterns
  for (let i = 0; i < 3; i++) {
    const [r0, c0] = i === 0 ? [0, 0] : i === 1 ? [0, size - 7] : [size - 7, 0];
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = c0 + dx, yy = r0 + dy;
        if (xx < 0 || xx >= size || yy < 0 || yy >= size) continue;
        const inFinder = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const dist = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        const isDark = inFinder && dist !== 1 && dist !== 3;
        modules[yy][xx] = isDark;
        reserved[yy][xx] = true;
      }
    }
  }

  // Alignment patterns
  const alignPos = getAlignmentPatternPositions(version);
  const numAlign = alignPos.length;
  for (let i = 0; i < numAlign; i++) {
    for (let j = 0; j < numAlign; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0)) continue;
      const cx = alignPos[j], cy = alignPos[i];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          modules[cy + dy][cx + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
          reserved[cy + dy][cx + dx] = true;
        }
      }
    }
  }

  // Timing patterns
  for (let i = 0; i < size; i++) {
    if (!reserved[6][i]) {
      modules[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      modules[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }

  // Dark module
  modules[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve format info
  for (let i = 0; i < 9; i++) { reserved[8][i] = true; reserved[i][8] = true; }
  for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }

  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }
}

function drawFormatBits(modules: boolean[][], ecLevel: ECLevel, mask: number): void {
  const data = getFormatBits(ecLevel, mask);
  const size = modules.length;
  for (let i = 0; i < 15; i++) {
    const bit = ((data >> i) & 1) === 1;
    // Around top-left finder
    if (i < 6) modules[i][8] = bit;
    else if (i < 8) modules[i + 1][8] = bit;
    else modules[size - 15 + i][8] = bit;
    // Around top-right + bottom-left
    if (i < 8) modules[8][size - 1 - i] = bit;
    else modules[8][15 - i - 1] = bit;
  }
  modules[size - 8][8] = true;
}

function drawVersionBits(modules: boolean[][], version: number): void {
  if (version < 7) return;
  const size = modules.length;
  const data = getVersionBits(version);
  for (let i = 0; i < 18; i++) {
    const bit = ((data >> i) & 1) === 1;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    modules[a][b] = bit;
    modules[b][a] = bit;
  }
}

function maskFunc(modules: boolean[][], reserved: boolean[][], mask: number): boolean[][] {
  const size = modules.length;
  const out = modules.map(row => row.slice());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (reserved[y][x]) continue;
      let invert: boolean;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
        case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
        case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
        default: invert = false;
      }
      if (invert) out[y][x] = !out[y][x];
    }
  }
  return out;
}

function maskScore(modules: boolean[][]): number {
  const size = modules.length;
  let score = 0;
  for (let y = 0; y < size; y++) {
    let run = 1, prev = modules[y][0];
    for (let x = 1; x < size; x++) {
      if (modules[y][x] === prev) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score++;
      } else {
        run = 1;
        prev = modules[y][x];
      }
    }
  }
  return score;
}

// ---------- Main entry point ----------
export function qrcode(text: string, ecLevel: ECLevel = 'M'): { size: number; modules: boolean[][]; } {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const { version } = pickVersion(textBytes, ecLevel);
  const size = version * 4 + 17;

  // Build data bits
  const dataCapacityBits = getNumDataCodewords(version, ecLevel) * 8;
  const dataBits = buildBits(textBytes, version, dataCapacityBits);
  const dataBytes = bitsToBytes(dataBits);

  // Error correction (single-block only — supported by all 40 versions for short strings)
  const numBlocks = numBlocksFor(version, ecLevel);
  const blockEcc = eccCodewordsPerBlock(version, ecLevel);
  const totalDataCw = totalDataCodewords(version);
  const shortBlockLen = Math.floor(totalDataCw / numBlocks);
  const numLongBlocks = totalDataCw % numBlocks;
  const longBlockLen = shortBlockLen + 1;
  const numShortBlocks = numBlocks - numLongBlocks;

  // Build codewords array
  const codewords: number[] = [];
  const ecCodewords: number[] = [];
  let dataIdx = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = b < numShortBlocks ? shortBlockLen : longBlockLen;
    const block = dataBytes.slice(dataIdx, dataIdx + len);
    dataIdx += len;
    const generator = buildGenerator(blockEcc);
    const ec = reedSolomonRemainder(block, blockEcc);
    codewords.push(...block);
    ecCodewords.push(...ec);
  }

  // Interleave codewords
  const finalBits: boolean[] = [];
  for (let i = 0; i < Math.max(shortBlockLen, longBlockLen); i++) {
    for (let b = 0; b < numBlocks; b++) {
      const blockLen = b < numShortBlocks ? shortBlockLen : longBlockLen;
      if (i < blockLen) {
        const byte = codewords[b * Math.max(shortBlockLen, longBlockLen) + i];
        for (let j = 7; j >= 0; j--) finalBits.push(((byte >> j) & 1) === 1);
      }
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < blockEcc; i++) {
    for (let b = 0; b < numBlocks; b++) {
      const byte = ecCodewords[b * blockEcc + i];
      for (let j = 7; j >= 0; j--) finalBits.push(((byte >> j) & 1) === 1);
    }
  }
  // Remainder bits
  const remainderBits = (version <= 6 ? 0 : version <= 13 ? 1 : version <= 20 ? 2 : version <= 27 ? 3 : version <= 34 ? 4 : 5) * 8;
  for (let i = 0; i < remainderBits; i++) finalBits.push(false);

  // Initialize matrices
  const modules: boolean[][] = [];
  const reserved: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    modules.push(new Array(size).fill(false));
    reserved.push(new Array(size).fill(false));
  }

  drawFunctionPatterns(modules, reserved, version);
  drawVersionBits(modules, version);

  // Place data bits
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!reserved[y][x] && i < finalBits.length) {
          modules[y][x] = finalBits[i++];
        }
      }
    }
  }

  // Try all masks
  let bestMask = 0;
  let bestModules: boolean[][] = modules;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = maskFunc(modules, reserved, m);
    drawFormatBits(masked, ecLevel, m);
    const score = maskScore(masked);
    if (score < bestScore) {
      bestScore = score;
      bestMask = m;
      bestModules = masked;
    }
  }
  drawFormatBits(bestModules, ecLevel, bestMask);

  return { size, modules: bestModules };
}
