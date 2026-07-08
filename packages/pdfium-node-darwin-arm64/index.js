import { createRequire } from "node:module";
import { deflateSync } from "node:zlib";

const require = createRequire(import.meta.url);
const native = require("./prebuilds/darwin-arm64/pdfium_node_native.node");
const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function getNativeBuildInfo() {
  return native.getNativeBuildInfo();
}

export async function renderPdfThumbnailsNative(pdf, options = {}) {
  if (options.timeoutMs <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (options.format !== "png") {
    throw new Error("JPEG encoding is not implemented yet.");
  }

  return native.renderPdfPagesRaw(pdf, options).map((page) => ({
    page: page.page,
    width: page.width,
    height: page.height,
    mimeType: "image/png",
    data: encodePng(page.width, page.height, page.data),
  }));
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
    chunk("IHDR", ihdr(width, height)),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdr(width, height) {
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

function chunk(type, data) {
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
