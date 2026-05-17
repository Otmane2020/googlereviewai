import jsPDF from "jspdf";
import QRCode from "qrcode";

interface QrLabelArgs {
  url: string;
  businessName: string;
  design?: "classic" | "dark" | "minimal" | string;
  copies?: number; // number of labels on the A4 sheet
}

/**
 * Generate a printable A4 PDF with multiple QR code adhesive labels
 * to be printed and mailed to the customer.
 */
export async function generatePrintableQrPDF({
  url,
  businessName,
  design = "classic",
  copies = 6,
}: QrLabelArgs): Promise<jsPDF> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;

  // Grid: 2 cols x 3 rows = 6 labels
  const cols = 2;
  const rows = Math.ceil(copies / cols);
  const cellW = (pageW - margin * 2) / cols;
  const cellH = (pageH - margin * 2) / rows;

  const palette = design === "dark"
    ? { bg: [17, 24, 39], fg: [255, 255, 255], accent: [16, 185, 129] }
    : design === "minimal"
    ? { bg: [236, 253, 245], fg: [6, 78, 59], accent: [5, 150, 105] }
    : { bg: [255, 255, 255], fg: [15, 23, 42], accent: [13, 148, 136] };

  for (let i = 0; i < copies; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * cellW + 3;
    const y = margin + row * cellH + 3;
    const w = cellW - 6;
    const h = cellH - 6;

    // Background
    pdf.setFillColor(palette.bg[0], palette.bg[1], palette.bg[2]);
    pdf.roundedRect(x, y, w, h, 4, 4, "F");
    pdf.setDrawColor(palette.accent[0], palette.accent[1], palette.accent[2]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, 4, 4, "S");

    // Heading
    pdf.setTextColor(palette.fg[0], palette.fg[1], palette.fg[2]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Laissez-nous votre avis", x + w / 2, y + 8, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const cleanName = businessName.length > 28 ? businessName.slice(0, 26) + "…" : businessName;
    pdf.text(cleanName, x + w / 2, y + 13, { align: "center" });

    // QR
    const qrSize = Math.min(w - 16, h - 35);
    const qrX = x + (w - qrSize) / 2;
    const qrY = y + 16;
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Footer
    pdf.setFontSize(7);
    pdf.setTextColor(palette.accent[0], palette.accent[1], palette.accent[2]);
    pdf.text("Scannez avec votre téléphone", x + w / 2, y + h - 6, { align: "center" });
  }

  // Footer info
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Starlinko · ${businessName} · ${url.length > 80 ? url.slice(0, 80) + "…" : url}`,
    margin,
    pageH - 5,
  );

  return pdf;
}

export async function downloadQrLabelPDF(args: QrLabelArgs, filename = "qr-labels.pdf") {
  const pdf = await generatePrintableQrPDF(args);
  pdf.save(filename);
}
