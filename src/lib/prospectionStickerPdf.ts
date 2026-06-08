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

let _faviconCache: string | null = null;
async function loadFavicon(): Promise<string | null> {
  if (_faviconCache !== null) return _faviconCache || null;
  try {
    const res = await fetch("/favicon.png");
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    _faviconCache = dataUrl;
    return dataUrl;
  } catch {
    _faviconCache = "";
    return null;
  }
}

function drawRankiLogo(pdf: jsPDF, x: number, y: number, scale = 1, favicon?: string | null) {
  const iconSize = 4.4 * scale;
  if (favicon) {
    pdf.addImage(favicon, "PNG", x, y - iconSize / 2, iconSize, iconSize);
  } else {
    const pinR = 2.2 * scale;
    pdf.setFillColor(20, 122, 88);
    pdf.circle(x + pinR, y, pinR, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6 * scale);
    pdf.text("R", x + pinR, y + 0.7 * scale, { align: "center" });
  }
  const txtX = x + iconSize + 1.2;
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
  favicon?: string | null,
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
  drawRankiLogo(pdf, cx - 8, mentionY - 1.2, 0.75, favicon);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.5);
  pdf.setTextColor(110, 110, 110);
  pdf.text("Répondeur automatique d'avis Google par IA", cx, cy + innerR - 4, {
    align: "center",
  });
}

// ---------- cut marks ----------
function drawCutMarks(pdf: jsPDF, cx: number, cy: number, r: number) {
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.18);
  pdf.setLineDashPattern([1.2, 1.2], 0);
  const segs = 72;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    pdf.line(
      cx + (r + 1.8) * Math.cos(a1),
      cy + (r + 1.8) * Math.sin(a1),
      cx + (r + 1.8) * Math.cos(a2),
      cy + (r + 1.8) * Math.sin(a2),
    );
  }
  pdf.setLineDashPattern([], 0);

  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.3);
  const cm = r + 4.5;
  const ml = 3;
  const corners: [number, number, number, number][] = [
    [cx - cm, cy - cm, 1, 1],
    [cx + cm, cy - cm, -1, 1],
    [cx - cm, cy + cm, 1, -1],
    [cx + cm, cy + cm, -1, -1],
  ];
  for (const [px, py, dx, dy] of corners) {
    pdf.line(px, py, px + ml * dx, py);
    pdf.line(px, py, px, py + ml * dy);
  }

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(6.2);
  pdf.setTextColor(90, 90, 90);
  pdf.text("A coller sur votre vitrine ou comptoir", cx, cy - r - 6, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text("- - decouper le long du cercle - -", cx, cy + r + 7, { align: "center" });
}

// ---------- letter ----------
function drawTag(pdf: jsPDF, x: number, y: number, label: string, rgb: number[]) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  const tw = pdf.getTextWidth(label) + 4;
  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  pdf.roundedRect(x, y - 3.2, tw, 4.6, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text(label, x + 2, y);
  return tw;
}

function drawLetter(
  pdf: jsPDF,
  client: ProspectionClient,
  x: number,
  y: number,
  w: number,
  h: number,
  favicon?: string | null,
) {
  drawRankiLogo(pdf, x, y + 4, 1.2, favicon);

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(x, y + 9, x + w, y + 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Un cadeau pour booster votre e-reputation", x, y + 16);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const name = client.businessName.length > 45
    ? client.businessName.slice(0, 43) + "..."
    : client.businessName;
  pdf.text(`A l'attention de : ${name}`, x, y + 22);
  if (client.address) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 110, 110);
    const addr = client.address.length > 70
      ? client.address.slice(0, 68) + "..."
      : client.address;
    pdf.text(addr, x, y + 26);
  }

  let tagX = x;
  tagX += drawTag(pdf, tagX, y + 32, "AVIS GOOGLE", G.blue) + 2;
  tagX += drawTag(pdf, tagX, y + 32, "IA 24/7", [20, 122, 88]) + 2;
  tagX += drawTag(pdf, tagX, y + 32, "GEO / AEO", [147, 51, 234]) + 2;
  drawTag(pdf, tagX, y + 32, "GRATUIT", G.red);

  const body: { text: string; color?: number[]; bold?: boolean }[] = [
    { text: "Bonjour," },
    { text: "" },
    { text: "Vous trouverez ci-joint un support Google personnalise," },
    { text: "a coller sur l'une de vos vitrines ou a votre comptoir." },
    { text: "" },
    { text: "Vos clients laissent un avis en quelques secondes en" },
    { text: "scannant le QR code (lie a votre fiche Google)." },
    { text: "" },
    { text: "Ce sticker est un cadeau offert par Ranki.ai pour vous" },
    { text: "aider a collecter plus d'avis et booster votre visibilite." },
    { text: "" },
    { text: "BONUS 1 - Reponse automatique aux avis Google :", color: [20, 122, 88], bold: true },
    { text: "notre IA repond avec votre ton de marque, 24h/24." },
    { text: "" },
    { text: "BONUS 2 - GEO / AEO :", color: [147, 51, 234], bold: true },
    { text: "soyez recommande par ChatGPT, Gemini et Perplexity" },
    { text: "quand vos prospects cherchent votre type d'etablissement." },
    { text: "" },
    { text: "Belle journee," },
    { text: "L'equipe Ranki.ai" },
  ];
  let cy = y + 40;
  for (const line of body) {
    pdf.setFont("helvetica", line.bold ? "bold" : "normal");
    pdf.setFontSize(8);
    const c = line.color || [40, 40, 40];
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.text(line.text, x, cy);
    cy += 3.7;
  }

  const ctaY = y + h - 22;
  pdf.setFillColor(240, 253, 244);
  pdf.setDrawColor(52, 168, 83);
  pdf.roundedRect(x, ctaY, w, 14, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 122, 88);
  pdf.text("Activez tout sur ranki.ai", x + 3, ctaY + 5.5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(60, 60, 60);
  pdf.text("Inscription gratuite - 25 avis IA/mois offerts - Sans engagement", x + 3, ctaY + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Ranki.ai - Reponse auto avis Google + boost IA (ChatGPT, Gemini, Perplexity)", x, y + h - 2);
}

// ---------- page ----------
export async function generateProspectionStickerPDF(
  clients: ProspectionClient[],
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 8;

  const rowH = (pageH - margin * 2) / 2;
  const stickerD = Math.min(rowH - 18, 105);
  const stickerW = stickerD + 10;
  const letterX = margin + stickerW + 4;
  const letterW = pageW - letterX - margin;

  for (let i = 0; i < clients.length; i++) {
    if (i > 0 && i % 2 === 0) pdf.addPage();
    const slot = i % 2;
    const rowY = margin + slot * rowH;
    const cx = margin + stickerW / 2;
    const cy = rowY + rowH / 2;

    await drawSticker(pdf, clients[i], cx, cy, stickerD);
    drawCutMarks(pdf, cx, cy, stickerD / 2);
    drawLetter(pdf, clients[i], letterX, rowY + 4, letterW, rowH - 8);

    if (slot === 0) {
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.3);
      pdf.setLineDashPattern([2.5, 2], 0);
      const sepY = margin + rowH;
      pdf.line(margin, sepY, pageW - margin, sepY);
      pdf.setLineDashPattern([], 0);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(6);
      pdf.setTextColor(120, 120, 120);
      pdf.text("- - - decouper ici - - -", pageW / 2, sepY - 1, { align: "center" });
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
