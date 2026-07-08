import { writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { root } from "./lib/repo.mjs";

const execFileAsync = promisify(execFile);

await writeFile(
  join(root, "fixtures/simple-one-page.pdf"),
  createPdf([pageText("PDFium Node", 50, 100)])
);

await writeFile(
  join(root, "fixtures/multi-page.pdf"),
  createPdf([
    pageText("First page", 48, 110),
    pageText("Second page", 42, 110),
  ])
);

await writeFile(
  join(root, "fixtures/image-heavy.pdf"),
  createPdf([imagePage()])
);

await execFileAsync("qpdf", [
  "--encrypt",
  "user",
  "owner",
  "256",
  "--",
  join(root, "fixtures/simple-one-page.pdf"),
  join(root, "fixtures/encrypted.pdf"),
]);

function createPdf(pageContents) {
  const objects = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageContents
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] /Count ${pageContents.length} >>`
  );

  const fontObjectNumber = 3 + pageContents.length * 2;
  const imageObjectNumber = fontObjectNumber + 1;

  for (let index = 0; index < pageContents.length; index += 1) {
    const pageObject = 3 + index * 2;
    const contentObject = pageObject + 1;
    const resources = pageContents[index].image
      ? `<< /XObject << /Im1 ${imageObjectNumber} 0 R >> >>`
      : `<< /Font << /F1 ${fontObjectNumber} 0 R >> >>`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents ${contentObject} 0 R /Resources ${resources} >>`
    );
    objects.push(stream(pageContents[index].content));
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  if (pageContents.some((page) => page.image)) {
    objects.push(stream(imageBytes(), imageDictionary()));
  }

  return serializePdf(objects);
}

function pageText(text, x, y) {
  return {
    content: `BT
/F1 24 Tf
${x} ${y} Td
(${text}) Tj
ET
`,
  };
}

function imagePage() {
  return {
    image: true,
    content: `q
160 0 0 160 20 20 cm
/Im1 Do
Q
`,
  };
}

function imageDictionary() {
  return "<< /Type /XObject /Subtype /Image /Width 8 /Height 8 /ColorSpace /DeviceRGB /BitsPerComponent 8 >>";
}

function imageBytes() {
  const bytes = [];

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bytes.push(x * 32, y * 32, (x + y) * 16);
    }
  }

  return Buffer.from(bytes);
}

function stream(content, dictionary = "") {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "binary");
  return `<< /Length ${buffer.length}${dictionary ? ` ${dictionary.slice(3, -3)}` : ""} >>
stream
${buffer.toString("binary")}
endstream`;
}

function serializePdf(objects) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f
`;

  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n
`;
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`;

  return Buffer.from(pdf, "binary");
}
