import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface ProspectionClient {
  businessName: string;
  placeId: string;
  address?: string;
}

const G = {
  blue: [66, 133, 244],
  red: [234, 67, 53],
  yellow: [251, 188, 5],
  green: [52, 168, 83],
};

// ---------- helpers ----------
function drawGoogleRing(pdf: jsPDF, cx: number, cy: number, outerR: number, innerR: number) {
  const segments = 60;
  const quarters = [
    { color: G.red, start: -135 },
    { color: G.yellow, start: -45 },
    { color: G.green, start: 45 },
    { color: G.blue, start: 135 },
  ];
  for (const q of quarters) {
    const pts: [number, number][] = [];
    const s = (q.start * Math.PI) / 180;
    const e = ((q.start + 90) * Math.PI) / 180;
    for (let i = 0; i <= segments; i++) {
      const a = s + ((e - s) * i) / segments;
      pts.push([cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)]);
    }
    for (let i = segments; i >= 0; i--) {
      const a = s + ((e - s) * i) / segments;
      pts.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
    }
    pdf.setFillColor(q.color[0], q.color[1], q.color[2]);
    const lines: [number, number][] = pts.slice(1).map((p, i) => [
      p[0] - pts[i][0],
      p[1] - pts[i][1],
    ]);
    pdf.lines(lines, pts[0][0], pts[0][1], [1, 1], "F", true);
  }
}

function drawStar(
  pdf: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  rgb: number[],
) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (-Math.PI / 2) + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const lines: [number, number][] = pts.slice(1).map((p, i) => [
    p[0] - pts[i][0],
    p[1] - pts[i][1],
  ]);
  pdf.lines(lines, pts[0][0], pts[0][1], [1, 1], "F", true);
}

function drawStarsRow(pdf: jsPDF, cx: number, cy: number, count = 5, size = 3) {
  const gap = size * 2.6;
  const totalW = (count - 1) * gap;
  const startX = cx - totalW / 2;
  for (let i = 0; i < count; i++) {
    drawStar(pdf, startX + i * gap, cy, size, size * 0.45, G.yellow);
  }
}

function drawRankiLogo(pdf: jsPDF, x: number, y: number, scale = 1) {
  // simple location-pin "R" mark + "Ranki.ai" text (Ranki dark, .ai blue)
  // Pin
  const pinR = 2.2 * scale;
  pdf.setFillColor(20, 122, 88); // emerald-ish
  pdf.circle(x + pinR, y, pinR, "F");
  // tiny white "R" inside
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6 * scale);
  pdf.text("R", x + pinR, y + 0.7 * scale, { align: "center" });
  // wordmark
  const txtX = x + pinR * 2 + 1.2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9 * scale);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Ranki", txtX, y + 1.2 * scale);
  const rw = pdf.getTextWidth("Ranki");
  pdf.setTextColor(G.blue[0], G.blue[1], G.blue[2]);
  pdf.text(".ai", txtX + rw, y + 1.2 * scale);
}

// ---------- sticker (circle) ----------
async function drawSticker(
  pdf: jsPDF,
  client: ProspectionClient,
  cx: number,
  cy: number,
  diameter: number,
) {
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${client.placeId}`;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 800,
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const outerR = diameter / 2;
  const ringW = 5.5;
  const innerR = outerR - ringW;

  drawGoogleRing(pdf, cx, cy, outerR, innerR);
  pdf.setFillColor(255, 255, 255);
  pdf.circle(cx, cy, innerR, "F");

  // "Laissez-nous votre avis sur"
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  pdf.text("Laissez-nous votre avis sur", cx, cy - innerR + 11, { align: "center" });

  // "Google" multicolored
  const googleY = cy - innerR + 21;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  const letters = ["G", "o", "o", "g", "l", "e"];
  const cols = [G.blue, G.red, G.yellow, G.blue, G.green, G.red];
  const widths = letters.map((l) => pdf.getTextWidth(l));
  const total = widths.reduce((a, b) => a + b, 0);
  let xc = cx - total / 2;
  letters.forEach((l, i) => {
    pdf.setTextColor(cols[i][0], cols[i][1], cols[i][2]);
    pdf.text(l, xc, googleY);
    xc += widths[i];
  });

  // Action phrase
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text("MERCI DE PRENDRE UNE MINUTE", cx, googleY + 6, { align: "center" });
  pdf.text("POUR NOUS LAISSER UN AVIS !", cx, googleY + 10, { align: "center" });

  // Stars (drawn, not glyph)
  drawStarsRow(pdf, cx, googleY + 15.5, 5, 2.4);

  // QR code centered
  const qrSize = innerR * 0.85;
  const qrY = googleY + 19;
  pdf.addImage(qrDataUrl, "PNG", cx - qrSize / 2, qrY, qrSize, qrSize);

  // Mention "Propulsé par Ranki.ai"
  const mentionY = cy + innerR - 9;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text("Propulsé par", cx - 10, mentionY, { align: "right" });
  drawRankiLogo(pdf, cx - 8, mentionY - 1.2, 0.75);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.5);
  pdf.setTextColor(110, 110, 110);
  pdf.text("Répondeur automatique d'avis Google par IA", cx, cy + innerR - 4, {
    align: "center",
  });
}

// ---------- letter ----------
function drawLetter(
  pdf: jsPDF,
  client: ProspectionClient,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  // Header with logo
  drawRankiLogo(pdf, x, y + 4, 1.2);

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(x, y + 9, x + w, y + 9);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Un cadeau pour booster votre e-réputation 🎁", x, y + 16);

  // Recipient
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const name = client.businessName.length > 45
    ? client.businessName.slice(0, 43) + "…"
    : client.businessName;
  pdf.text(`À l'attention de : ${name}`, x, y + 22);
  if (client.address) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 110, 110);
    const addr = client.address.length > 70
      ? client.address.slice(0, 68) + "…"
      : client.address;
    pdf.text(addr, x, y + 26);
  }

  // Body
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  const body = [
    "Bonjour,",
    "",
    "Vous trouverez ci-joint un support Google personnalisé,",
    "à coller sur l'une de vos vitrines ou à votre comptoir.",
    "",
    "Il permet à vos clients de laisser un avis Google en",
    "quelques secondes, directement depuis leur téléphone",
    "via le QR code (lié à votre fiche).",
    "",
    "Ce sticker est un cadeau offert par Ranki.ai pour vous",
    "aider à collecter plus d'avis et améliorer votre",
    "visibilité locale.",
    "",
    "Bonus : ouvrez un compte gratuit sur Ranki.ai pour",
    "activer la réponse automatique à vos avis Google",
    "(notre IA répond avec votre ton de marque, 24/7).",
    "",
    "Belle journée,",
    "L'équipe Ranki.ai",
  ];
  let cy = y + 33;
  for (const line of body) {
    pdf.text(line, x, cy);
    cy += 4;
  }

  // CTA box
  const ctaY = y + h - 22;
  pdf.setFillColor(240, 253, 244);
  pdf.setDrawColor(52, 168, 83);
  pdf.roundedRect(x, ctaY, w, 14, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 122, 88);
  pdf.text("👉 Activez la réponse auto sur ranki.ai", x + 3, ctaY + 5.5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(60, 60, 60);
  pdf.text(
    "Inscription gratuite · 25 avis IA/mois offerts · Sans engagement",
    x + 3,
    ctaY + 10,
  );

  // Footer
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Ranki.ai · Répondeur automatique d'avis Google par IA", x, y + h - 2);
}

// ---------- page ----------
export async function generateProspectionStickerPDF(
  clients: ProspectionClient[],
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 8;

  // 2 clients per page, stacked vertically
  const rowH = (pageH - margin * 2) / 2; // ~140mm each
  // Each row: sticker on left, letter on right
  const stickerD = Math.min(rowH - 6, 110); // ~110mm circle
  const stickerW = stickerD + 4;
  const letterX = margin + stickerW + 4;
  const letterW = pageW - letterX - margin;

  for (let i = 0; i < clients.length; i++) {
    if (i > 0 && i % 2 === 0) pdf.addPage();
    const slot = i % 2;
    const rowY = margin + slot * rowH;
    const cx = margin + stickerW / 2;
    const cy = rowY + rowH / 2;

    await drawSticker(pdf, clients[i], cx, cy, stickerD);
    drawLetter(pdf, clients[i], letterX, rowY + 4, letterW, rowH - 8);

    // dashed separator between the two clients
    if (slot === 0) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(margin, margin + rowH, pageW - margin, margin + rowH);
      pdf.setLineDashPattern([], 0);
    }
  }

  return pdf;
}

export async function downloadProspectionStickerPDF(
  clients: ProspectionClient[],
  filename = "ranki-prospection.pdf",
) {
  const pdf = await generateProspectionStickerPDF(clients);
  pdf.save(filename);
}
