import { deflateSync } from "node:zlib";

const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const zigZag = [
  0, 1, 8, 16, 9, 2, 3, 10,
  17, 24, 32, 25, 18, 11, 4, 5,
  12, 19, 26, 33, 40, 48, 41, 34,
  27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36,
  29, 22, 15, 23, 30, 37, 44, 51,
  58, 59, 52, 45, 38, 31, 39, 46,
  53, 60, 61, 54, 47, 55, 62, 63,
];

const luminanceQuantization = [
  16, 11, 10, 16, 24, 40, 51, 61,
  12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77,
  24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

const chrominanceQuantization = [
  17, 18, 24, 47, 99, 99, 99, 99,
  18, 21, 26, 66, 99, 99, 99, 99,
  24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
];

const standardHuffmanTables = {
  luminanceDc: huffmanTable(
    [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  ),
  chrominanceDc: huffmanTable(
    [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  ),
  luminanceAc: huffmanTable(
    [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125],
    [
      1, 2, 3, 0, 4, 17, 5, 18, 33, 49, 65, 6,
      19, 81, 97, 7, 34, 113, 20, 50, 129, 145, 161, 8,
      35, 66, 177, 193, 21, 82, 209, 240, 36, 51, 98, 114,
      130, 9, 10, 22, 23, 24, 25, 26, 37, 38, 39, 40,
      41, 42, 52, 53, 54, 55, 56, 57, 58, 67, 68, 69,
      70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89,
      90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117,
      118, 119, 120, 121, 122, 131, 132, 133, 134, 135, 136, 137,
      138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163,
      164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182,
      183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201,
      202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 225, 226,
      227, 228, 229, 230, 231, 232, 233, 234, 241, 242, 243, 244,
      245, 246, 247, 248, 249, 250,
    ]
  ),
  chrominanceAc: huffmanTable(
    [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119],
    [
      0, 1, 2, 3, 17, 4, 5, 33, 49, 6, 18, 65,
      81, 7, 97, 113, 19, 34, 50, 129, 8, 20, 66, 145,
      161, 177, 193, 9, 35, 51, 82, 240, 21, 98, 114, 209,
      10, 22, 36, 52, 225, 37, 241, 23, 24, 25, 26, 38, 39,
      40, 41, 42, 53, 54, 55, 56, 57, 58, 67, 68, 69,
      70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89,
      90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117,
      118, 119, 120, 121, 122, 130, 131, 132, 133, 134, 135, 136,
      137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162,
      163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181,
      182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200,
      201, 202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 226,
      227, 228, 229, 230, 231, 232, 233, 234, 242, 243, 244, 245,
      246, 247, 248, 249, 250,
    ]
  ),
};

const cosine = Array.from({ length: 8 }, (_, frequency) =>
  Array.from({ length: 8 }, (_, position) =>
    Math.cos(((2 * position + 1) * frequency * Math.PI) / 16)
  )
);

const alpha = Array.from({ length: 8 }, (_, index) => (index === 0 ? 1 / Math.SQRT2 : 1));

export function encodeImage(format, width, height, rgba, quality = 72) {
  if (format === "png") {
    return encodePng(width, height, rgba);
  }

  if (format === "jpeg") {
    return encodeJpeg(width, height, rgba, quality);
  }

  throw new Error(`Unsupported image format: ${format}`);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const targetOffset = y * (stride + 1);
    const sourceOffset = y * stride;
    scanlines[targetOffset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + sourceOffset, stride).copy(
      scanlines,
      targetOffset + 1
    );
  }

  return Buffer.concat([
    pngSignature,
    pngChunk("IHDR", pngIhdr(width, height)),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeJpeg(width, height, rgba, quality) {
  const lumaTable = scaleQuantizationTable(luminanceQuantization, quality);
  const chromaTable = scaleQuantizationTable(chrominanceQuantization, quality);
  const writer = new JpegWriter();

  writer.marker(0xd8);
  writer.segment(0xe0, jfifHeader());
  writer.segment(0xdb, quantizationSegment(lumaTable, chromaTable));
  writer.segment(0xc0, frameHeader(width, height));
  writer.segment(0xc4, huffmanSegment(0, 0, standardHuffmanTables.luminanceDc));
  writer.segment(0xc4, huffmanSegment(1, 0, standardHuffmanTables.luminanceAc));
  writer.segment(0xc4, huffmanSegment(0, 1, standardHuffmanTables.chrominanceDc));
  writer.segment(0xc4, huffmanSegment(1, 1, standardHuffmanTables.chrominanceAc));
  writer.segment(0xda, scanHeader());

  const bitWriter = new EntropyWriter(writer);
  const previousDc = [0, 0, 0];

  for (let blockY = 0; blockY < height; blockY += 8) {
    for (let blockX = 0; blockX < width; blockX += 8) {
      const blocks = readColorBlocks(rgba, width, height, blockX, blockY);
      previousDc[0] = encodeBlock(
        bitWriter,
        quantizeBlock(blocks.y, lumaTable),
        previousDc[0],
        standardHuffmanTables.luminanceDc.codes,
        standardHuffmanTables.luminanceAc.codes
      );
      previousDc[1] = encodeBlock(
        bitWriter,
        quantizeBlock(blocks.cb, chromaTable),
        previousDc[1],
        standardHuffmanTables.chrominanceDc.codes,
        standardHuffmanTables.chrominanceAc.codes
      );
      previousDc[2] = encodeBlock(
        bitWriter,
        quantizeBlock(blocks.cr, chromaTable),
        previousDc[2],
        standardHuffmanTables.chrominanceDc.codes,
        standardHuffmanTables.chrominanceAc.codes
      );
    }
  }

  bitWriter.flush();
  writer.marker(0xd9);
  return writer.buffer();
}

function scaleQuantizationTable(baseTable, quality) {
  const scale = quality < 50 ? Math.floor(5000 / quality) : 200 - quality * 2;
  return baseTable.map((value) => clamp(Math.floor((value * scale + 50) / 100), 1, 255));
}

function jfifHeader() {
  return Buffer.from([0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
}

function quantizationSegment(lumaTable, chromaTable) {
  return Buffer.from([
    0,
    ...zigZag.map((index) => lumaTable[index]),
    1,
    ...zigZag.map((index) => chromaTable[index]),
  ]);
}

function frameHeader(width, height) {
  const data = Buffer.alloc(15);
  data[0] = 8;
  data.writeUInt16BE(height, 1);
  data.writeUInt16BE(width, 3);
  data[5] = 3;
  data[6] = 1;
  data[7] = 0x11;
  data[8] = 0;
  data[9] = 2;
  data[10] = 0x11;
  data[11] = 1;
  data[12] = 3;
  data[13] = 0x11;
  data[14] = 1;
  return data;
}

function huffmanSegment(tableClass, tableId, table) {
  return Buffer.from([(tableClass << 4) | tableId, ...table.counts, ...table.values]);
}

function scanHeader() {
  return Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0]);
}

function readColorBlocks(rgba, width, height, blockX, blockY) {
  const yBlock = new Array(64);
  const cbBlock = new Array(64);
  const crBlock = new Array(64);

  for (let y = 0; y < 8; y += 1) {
    const sourceY = Math.min(blockY + y, height - 1);

    for (let x = 0; x < 8; x += 1) {
      const sourceX = Math.min(blockX + x, width - 1);
      const offset = (sourceY * width + sourceX) * 4;
      const alphaValue = rgba[offset + 3] / 255;
      const red = rgba[offset] * alphaValue + 255 * (1 - alphaValue);
      const green = rgba[offset + 1] * alphaValue + 255 * (1 - alphaValue);
      const blue = rgba[offset + 2] * alphaValue + 255 * (1 - alphaValue);
      const index = y * 8 + x;

      yBlock[index] = 0.299 * red + 0.587 * green + 0.114 * blue - 128;
      cbBlock[index] = -0.168736 * red - 0.331264 * green + 0.5 * blue;
      crBlock[index] = 0.5 * red - 0.418688 * green - 0.081312 * blue;
    }
  }

  return { y: yBlock, cb: cbBlock, cr: crBlock };
}

function quantizeBlock(block, quantizationTable) {
  const result = new Array(64);

  for (let v = 0; v < 8; v += 1) {
    for (let u = 0; u < 8; u += 1) {
      let sum = 0;

      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          sum += block[y * 8 + x] * cosine[u][x] * cosine[v][y];
        }
      }

      const index = v * 8 + u;
      const coefficient = 0.25 * alpha[u] * alpha[v] * sum;
      result[index] = Math.round(coefficient / quantizationTable[index]);
    }
  }

  return result;
}

function encodeBlock(writer, block, previousDc, dcTable, acTable) {
  const dc = block[0];
  const dcDelta = dc - previousDc;
  const dcCategory = coefficientCategory(dcDelta);
  writer.writeCode(dcTable.get(dcCategory));
  writer.writeValue(dcDelta, dcCategory);

  let zeroRun = 0;

  for (let index = 1; index < 64; index += 1) {
    const coefficient = block[zigZag[index]];

    if (coefficient === 0) {
      zeroRun += 1;
      if (zeroRun === 16) {
        writer.writeCode(acTable.get(0xf0));
        zeroRun = 0;
      }
      continue;
    }

    const category = coefficientCategory(coefficient);
    writer.writeCode(acTable.get((zeroRun << 4) | category));
    writer.writeValue(coefficient, category);
    zeroRun = 0;
  }

  if (zeroRun > 0) {
    writer.writeCode(acTable.get(0));
  }

  return dc;
}

function coefficientCategory(value) {
  const absoluteValue = Math.abs(value);
  return absoluteValue === 0 ? 0 : Math.floor(Math.log2(absoluteValue)) + 1;
}

function huffmanTable(counts, values) {
  const codes = new Map();
  let code = 0;
  let valueIndex = 0;

  for (let bitLength = 1; bitLength <= 16; bitLength += 1) {
    const count = counts[bitLength - 1];

    for (let index = 0; index < count; index += 1) {
      codes.set(values[valueIndex], { value: code, length: bitLength });
      code += 1;
      valueIndex += 1;
    }

    code <<= 1;
  }

  return { counts, values, codes };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

class JpegWriter {
  bytes = [];

  marker(marker) {
    this.bytes.push(0xff, marker);
  }

  segment(marker, payload) {
    this.marker(marker);
    this.writeUint16(payload.length + 2);
    this.writeBytes(payload);
  }

  writeUint16(value) {
    this.bytes.push((value >> 8) & 0xff, value & 0xff);
  }

  writeBytes(bytes) {
    for (const byte of bytes) {
      this.bytes.push(byte);
    }
  }

  writeEntropyByte(byte) {
    this.bytes.push(byte);
    if (byte === 0xff) {
      this.bytes.push(0);
    }
  }

  buffer() {
    return Buffer.from(this.bytes);
  }
}

class EntropyWriter {
  bitBuffer = 0;
  bitCount = 0;

  constructor(writer) {
    this.writer = writer;
  }

  writeCode(code) {
    this.writeBits(code.value, code.length);
  }

  writeValue(value, bitCount) {
    if (bitCount === 0) {
      return;
    }

    const bits = value >= 0 ? value : value + (1 << bitCount) - 1;
    this.writeBits(bits, bitCount);
  }

  writeBits(value, bitCount) {
    for (let index = bitCount - 1; index >= 0; index -= 1) {
      this.bitBuffer = (this.bitBuffer << 1) | ((value >> index) & 1);
      this.bitCount += 1;

      if (this.bitCount === 8) {
        this.writer.writeEntropyByte(this.bitBuffer);
        this.bitBuffer = 0;
        this.bitCount = 0;
      }
    }
  }

  flush() {
    if (this.bitCount === 0) {
      return;
    }

    this.writer.writeEntropyByte((this.bitBuffer << (8 - this.bitCount)) | (0xff >> this.bitCount));
    this.bitBuffer = 0;
    this.bitCount = 0;
  }
}
