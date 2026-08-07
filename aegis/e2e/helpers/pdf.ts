export function createOfferPdf(name = 'Margaret Hamilton', role = 'Software Engineer', department = 'Engineering'): Uint8Array {
  const content = `BT /F1 12 Tf 72 720 Td (Name: ${name}) Tj 0 -20 Td (Role: ${role}) Tj 0 -20 Td (Department: ${department}) Tj ET`;
  const header = '%PDF-1.4\n';
  const body: string[] = [];
  const offsets: number[] = [];

  const push = (segment: string) => {
    offsets.push(Buffer.byteLength(header) + Buffer.byteLength(body.join('')));
    body.push(segment);
  };

  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  push(`4 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`);
  push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let out = header + body.join('');
  const xrefStart = Buffer.byteLength(out);
  out += 'xref\n0 6\n0000000000 65535 f \n';
  for (const offset of offsets) {
    out += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(out, 'latin1');
}
