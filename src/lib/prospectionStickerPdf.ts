import jsPDF from "jspdf";
import QRCode from "qrcode";

export type PdfLang = "fr" | "en";

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

const T = {
  fr: {
    stickerTop: "Laissez-nous votre avis sur",
    stickerCta1: "MERCI DE PRENDRE UNE MINUTE",
    stickerCta2: "POUR NOUS LAISSER UN AVIS !",
    poweredBy: "Propulsé par",
    stickerFoot: "Répondeur automatique d'avis Google par IA",
    cutCircle: "- - decouper le long du cercle - -",
    stickHere: "A coller sur votre vitrine ou comptoir",
    cutHere: "- - - decouper ici - - -",
    title: "Scannez le QR Code pour activer votre assistant Google Avis IA",
    to: "A l'attention de :",
    tags: ["AVIS GOOGLE", "IA 24/7", "GEO / AEO", "GRATUIT"],
    body: [
      "Bonjour,", "",
      "Vous trouverez ci-joint un support Google personnalise,",
      "a coller sur l'une de vos vitrines ou a votre comptoir.", "",
      "Vos clients laissent un avis en quelques secondes en",
      "scannant le QR code (lie a votre fiche Google).", "",
      "Ce sticker est un cadeau offert par Ranki.ai pour vous",
      "aider a collecter plus d'avis et booster votre visibilite.", "",
      "__B1__BONUS 1 - Reponse automatique aux avis Google :",
      "notre IA repond avec votre ton de marque, 24h/24.", "",
      "__B2__BONUS 2 - GEO / AEO :",
      "soyez recommande par ChatGPT, Gemini et Perplexity",
      "quand vos prospects cherchent votre type d'etablissement.", "",
      "Belle journee,", "L'equipe Ranki.ai",
    ],
    ctaTitle: "Activez tout sur ranki.ai",
    ctaSub: "25 reponses automatiques aux avis Google offertes - Sans engagement",
    footer: "Ranki.ai - Reponse auto avis Google + boost IA (ChatGPT, Gemini, Perplexity)",
  },
  en: {
    stickerTop: "Leave us your review on",
    stickerCta1: "TAKE A MINUTE TO LEAVE",
    stickerCta2: "US A REVIEW - THANK YOU !",
    poweredBy: "Powered by",
    stickerFoot: "Automatic AI replies to Google reviews",
    cutCircle: "- - cut along the circle - -",
    stickHere: "Stick on your window or counter",
    cutHere: "- - - cut here - - -",
    title: "Scan this QR code to activate your AI Google Reviews assistant",
    to: "To :",
    tags: ["GOOGLE REVIEWS", "AI 24/7", "GEO / AEO", "FREE"],
    body: [
      "Hello,", "",
      "Please find enclosed a personalized Google sticker,",
      "to stick on one of your windows or your counter.", "",
      "Your customers can leave a Google review in seconds",
      "by scanning the QR code (linked to your Google listing).", "",
      "This sticker is a gift from Ranki.ai to help you",
      "collect more reviews and boost your local visibility.", "",
      "__B1__BONUS 1 - Automatic replies to Google reviews:",
      "our AI replies in your brand voice, 24/7.", "",
      "__B2__BONUS 2 - GEO / AEO:",
      "get recommended by ChatGPT, Gemini and Perplexity",
      "when prospects search for your type of business.", "",
      "Best regards,", "The Ranki.ai team",
    ],
    ctaTitle: "Activate everything on ranki.ai",
    ctaSub: "25 free automatic replies to Google reviews - No commitment",
    footer: "Ranki.ai - Auto replies to Google reviews + AI boost (ChatGPT, Gemini, Perplexity)",
  },
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
  favicon: string | null,
  lang: PdfLang,
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

  const t = T[lang];
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  pdf.text(t.stickerTop, cx, cy - innerR + 11, { align: "center" });

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

  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text(t.stickerCta1, cx, googleY + 6, { align: "center" });
  pdf.text(t.stickerCta2, cx, googleY + 10, { align: "center" });

  drawStarsRow(pdf, cx, googleY + 15.5, 5, 2.4);

  const qrSize = innerR * 0.85;
  const qrY = googleY + 19;
  pdf.addImage(qrDataUrl, "PNG", cx - qrSize / 2, qrY, qrSize, qrSize);

  // --- Footer: Ranki.ai BIG + minimal tagline ---
  const footerY = cy + innerR - 11;

  // BIG Ranki.ai logo (favicon + bold text) — centered
  const logoScale = 1.15;
  const iconS = 4.4 * logoScale;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  const rankiW = pdf.getTextWidth("Ranki");
  const dotAiW = pdf.getTextWidth(".ai");
  const gap = 1.4;
  const logoW = iconS + gap + rankiW + dotAiW;
  let curX = cx - logoW / 2;

  if (favicon) {
    pdf.addImage(favicon, "PNG", curX, footerY - iconS / 2 - 0.4, iconS, iconS);
  } else {
    const pinR = 2.2 * logoScale;
    pdf.setFillColor(20, 122, 88);
    pdf.circle(curX + pinR, footerY - 0.4, pinR, "F");
  }
  curX += iconS + gap;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(30, 30, 30);
  pdf.text("Ranki", curX, footerY + 1.4);
  pdf.setTextColor(G.blue[0], G.blue[1], G.blue[2]);
  pdf.text(".ai", curX + rankiW, footerY + 1.4);

  // Minimal tagline below
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.8);
  pdf.setTextColor(120, 120, 120);
  const tagline = lang === "fr" ? "Répondeur IA d'avis Google" : "AI Google reviews assistant";
  pdf.text(tagline, cx, footerY + 5.8, { align: "center" });
}

function drawCutMarks(pdf: jsPDF, cx: number, cy: number, r: number, lang: PdfLang) {
  const t = T[lang];
  // Square cut marks only (no circle dotted line) — large & visible
  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.6);
  const cm = r + 5;
  const ml = 7;
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
  // Light dashed square outline connecting the corners (cut guide)
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.rect(cx - cm, cy - cm, cm * 2, cm * 2);
  pdf.setLineDashPattern([], 0);

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(6.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(t.stickHere, cx, cy - cm - 2, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.8);
  pdf.setTextColor(130, 130, 130);
  pdf.text(lang === "fr" ? "- - decouper le long du carre - -" : "- - cut along the square - -", cx, cy + cm + 4, { align: "center" });

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
  favicon: string | null,
  lang: PdfLang,
) {
  const t = T[lang];
  drawRankiLogo(pdf, x, y + 4, 1.2, favicon);

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(x, y + 9, x + w, y + 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(20, 20, 20);
  const titleLines = pdf.splitTextToSize(t.title, w);
  pdf.text(titleLines, x, y + 16);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const name = client.businessName.length > 45
    ? client.businessName.slice(0, 43) + "..."
    : client.businessName;
  pdf.text(`${t.to} ${name}`, x, y + 22);
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
  tagX += drawTag(pdf, tagX, y + 32, t.tags[0], G.blue) + 2;
  tagX += drawTag(pdf, tagX, y + 32, t.tags[1], [20, 122, 88]) + 2;
  tagX += drawTag(pdf, tagX, y + 32, t.tags[2], [147, 51, 234]) + 2;
  drawTag(pdf, tagX, y + 32, t.tags[3], G.red);

  let cy = y + 40;
  for (const raw of t.body) {
    let text = raw;
    let color: number[] = [40, 40, 40];
    let bold = false;
    if (raw.startsWith("__B1__")) {
      text = raw.slice(6);
      color = [20, 122, 88];
      bold = true;
    } else if (raw.startsWith("__B2__")) {
      text = raw.slice(6);
      color = [147, 51, 234];
      bold = true;
    }
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(text, x, cy);
    cy += 3.7;
  }

  const ctaY = y + h - 22;
  pdf.setFillColor(240, 253, 244);
  pdf.setDrawColor(52, 168, 83);
  pdf.roundedRect(x, ctaY, w, 14, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 122, 88);
  pdf.text(t.ctaTitle, x + 3, ctaY + 5.5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(60, 60, 60);
  pdf.text(t.ctaSub, x + 3, ctaY + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text(t.footer, x, y + h - 2);
}

// ---------- page ----------
export async function generateProspectionStickerPDF(
  clients: ProspectionClient[],
  lang: PdfLang = "fr",
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const favicon = await loadFavicon();
  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const t = T[lang];

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

    await drawSticker(pdf, clients[i], cx, cy, stickerD, favicon, lang);
    drawCutMarks(pdf, cx, cy, stickerD / 2, lang);
    drawLetter(pdf, clients[i], letterX, rowY + 4, letterW, rowH - 8, favicon, lang);

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
      pdf.text(t.cutHere, pageW / 2, sepY - 1, { align: "center" });
    }
  }

  return pdf;
}

export async function downloadProspectionStickerPDF(
  clients: ProspectionClient[],
  filename = "ranki-prospection.pdf",
  lang: PdfLang = "fr",
) {
  const pdf = await generateProspectionStickerPDF(clients, lang);
  pdf.save(filename);
}

// ---------- single A4 landscape sheet (for Print & Ship via Gelato) ----------
// A4 paysage 297x210mm : lettre personnalisée à gauche + sticker rond à découper à droite.
// Imprimé sur flyer A4 glossy 250gsm par Gelato, plié en deux et envoyé au prospect.
export async function generateSingleStickerPDFBlob(
  client: ProspectionClient,
  lang: PdfLang = "fr",
): Promise<Blob> {
  // Gelato A4 landscape requires 3mm bleed on each side → 303 x 213 mm
  const bleed = 3;
  const trimW = 297;
  const trimH = 210;
  const pageW = trimW + bleed * 2; // 303
  const pageH = trimH + bleed * 2; // 213
  const pdf = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: "landscape" });
  const favicon = await loadFavicon();
  const margin = 10;
  const t = T[lang];

  // White background covering full bleed area (avoids Gelato "design file" rejection)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageW, pageH, "F");

  const ox = bleed;
  const oy = bleed;

  // Right side: sticker
  const stickerD = Math.min(trimH - margin * 2 - 10, 130);
  const stickerCx = ox + trimW - margin - stickerD / 2 - 5;
  const stickerCy = oy + trimH / 2;
  await drawSticker(pdf, client, stickerCx, stickerCy, stickerD, favicon, lang);
  drawCutMarks(pdf, stickerCx, stickerCy, stickerD / 2, lang);

  // Left side: letter
  const letterX = ox + margin;
  const letterW = stickerCx - stickerD / 2 - 10 - letterX;
  const letterY = oy + margin;
  const letterH = trimH - margin * 2;
  drawLetter(pdf, client, letterX, letterY, letterW, letterH, favicon, lang);

  // Vertical fold mark down the middle (of trim)
  const midX = ox + trimW / 2;
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.2);
  pdf.setLineDashPattern([2.5, 2], 0);
  pdf.line(midX, oy + margin, midX, oy + trimH - margin);
  pdf.setLineDashPattern([], 0);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(6);
  pdf.setTextColor(130, 130, 130);
  pdf.text(lang === "fr" ? "- - plier ici - -" : "- - fold here - -", midX, oy + margin - 2, { align: "center" });

  return pdf.output("blob");
}


// ---------- Branded Label sticker only (Gelato 7.62 x 10.16 cm vertical, with 3mm bleed) ----------
// Gelato Branded Label format. Vertical rectangle. Sticker design inside trim area.
export async function generateBrandedLabelPDFBlob(
  client: ProspectionClient,
  lang: PdfLang = "fr",
): Promise<Blob> {
  const bleed = 3;
  const trimW = 76.2;   // 7.62 cm
  const trimH = 101.6;  // 10.16 cm
  const pageW = trimW + bleed * 2;
  const pageH = trimH + bleed * 2;
  const pdf = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: "portrait" });
  const favicon = await loadFavicon();
  const t = T[lang];

  // White bleed background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageW, pageH, "F");

  const ox = bleed, oy = bleed;
  const cx = ox + trimW / 2;

  // Top + bottom Google color bars
  const barH = 4;
  const seg = trimW / 4;
  const cols = [G.blue, G.red, G.yellow, G.green];
  cols.forEach((c, i) => {
    pdf.setFillColor(c[0], c[1], c[2]);
    pdf.rect(ox + i * seg, oy, seg, barH, "F");
    pdf.rect(ox + i * seg, oy + trimH - barH, seg, barH, "F");
  });

  // Top label
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("times", "italic");
  pdf.setFontSize(10);
  pdf.text(t.stickerTop, cx, oy + 10, { align: "center" });

  // Google word
  const gy = oy + 22;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  const letters = ["G", "o", "o", "g", "l", "e"];
  const colorsG = [G.blue, G.red, G.yellow, G.blue, G.green, G.red];
  const widths = letters.map((l) => pdf.getTextWidth(l));
  const total = widths.reduce((a, b) => a + b, 0);
  let xc = cx - total / 2;
  letters.forEach((l, i) => {
    pdf.setTextColor(colorsG[i][0], colorsG[i][1], colorsG[i][2]);
    pdf.text(l, xc, gy);
    xc += widths[i];
  });

  // Stars
  drawStarsRow(pdf, cx, gy + 7, 5, 2.2);

  // CTA
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text(t.stickerCta1, cx, gy + 14, { align: "center" });
  pdf.text(t.stickerCta2, cx, gy + 18, { align: "center" });

  // QR
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${client.placeId}`;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 800, margin: 0, errorCorrectionLevel: "H",
  });
  const qrSize = 52;
  const qrX = cx - qrSize / 2;
  const qrY = gy + 22;
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1.5, 1.5);
  pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Footer logo
  const footerY = oy + trimH - 10;
  const iconS = 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  const rankiW = pdf.getTextWidth("Ranki");
  const dotW = pdf.getTextWidth(".ai");
  const gap = 1.2;
  const totalW = iconS + gap + rankiW + dotW;
  let cur = cx - totalW / 2;
  if (favicon) pdf.addImage(favicon, "PNG", cur, footerY - iconS / 2 - 0.4, iconS, iconS);
  cur += iconS + gap;
  pdf.setTextColor(30, 30, 30);
  pdf.text("Ranki", cur, footerY + 1.2);
  pdf.setTextColor(G.blue[0], G.blue[1], G.blue[2]);
  pdf.text(".ai", cur + rankiW, footerY + 1.2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.5);
  pdf.setTextColor(120, 120, 120);
  pdf.text(lang === "fr" ? "Répondeur IA d'avis Google" : "AI Google reviews assistant", cx, footerY + 5, { align: "center" });

  return pdf.output("blob");
}

// ---------- A4 letter-only PDF (no sticker) ----------
export async function generateLetterOnlyPDFBlob(
  client: ProspectionClient,
  lang: PdfLang = "fr",
): Promise<Blob> {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const favicon = await loadFavicon();
  const margin = 15;
  const pageW = 210;
  const pageH = 297;
  drawLetter(pdf, client, margin, margin, pageW - margin * 2, pageH - margin * 2, favicon, lang);
  return pdf.output("blob");
}
