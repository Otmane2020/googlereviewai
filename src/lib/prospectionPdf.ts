import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface ProspectClient {
  businessName: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  reviewUrl?: string;
}

/** Dessine une étoile pleine 5 branches centrée en (cx,cy) de rayon r. */
function drawStar(
  pdf: jsPDF,
  cx: number,
  cy: number,
  r: number,
  color: [number, number, number],
) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    pts.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  pdf.setFillColor(color[0], color[1], color[2]);
  // jsPDF.lines: relative segments
  const start = pts[0];
  const segments: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    segments.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  segments.push([start[0] - pts[pts.length - 1][0], start[1] - pts[pts.length - 1][1]]);
  pdf.lines(segments, start[0], start[1], [1, 1], "F", true);
}

/** Dessine un arc solide (anneau partiel) lisse. */
function drawArcRing(
  pdf: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
  thickness: number,
  color: [number, number, number],
) {
  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(thickness);
  pdf.setLineCap("butt");
  const steps = 120;
  const step = (endDeg - startDeg) / steps;
  let prev: [number, number] | null = null;
  for (let i = 0; i <= steps; i++) {
    const a = ((startDeg + step * i) * Math.PI) / 180;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (prev) pdf.line(prev[0], prev[1], x, y);
    prev = [x, y];
  }
}

async function drawClientBlock(
  pdf: jsPDF,
  client: ProspectClient,
  yOffset: number,
  pageW: number,
  blockH: number,
) {
  const margin = 8;
  // Sticker plus grand
  const stickerSize = Math.min(blockH - 10, 125);
  const stickerCX = margin + stickerSize / 2;
  const stickerCY = yOffset + blockH / 2;
  const r = stickerSize / 2;

  // ====== STICKER ROND ======
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(235, 235, 235);
  pdf.setLineWidth(0.3);
  pdf.circle(stickerCX, stickerCY, r, "FD");

  // 4 arcs Google solides (épais)
  const ringR = r - 2.5;
  const ringW = 4.5;
  // Angles : haut=rouge (-135 → -45), droite=bleu (-45 → 45), bas=vert (45 → 135), gauche=jaune (135 → 225)
  drawArcRing(pdf, stickerCX, stickerCY, ringR, -135, -45, ringW, [234, 67, 53]);
  drawArcRing(pdf, stickerCX, stickerCY, ringR, -45, 45, ringW, [66, 133, 244]);
  drawArcRing(pdf, stickerCX, stickerCY, ringR, 45, 135, ringW, [52, 168, 83]);
  drawArcRing(pdf, stickerCX, stickerCY, ringR, 135, 225, ringW, [251, 188, 5]);
  pdf.setLineWidth(0.2);

  // Nom établissement (haut)
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  const maxW = r * 1.4;
  const nameLines = pdf.splitTextToSize(client.businessName, maxW).slice(0, 2);
  let ny = stickerCY - r * 0.55;
  nameLines.forEach((ln: string) => {
    pdf.text(ln, stickerCX, ny, { align: "center" });
    ny += 5;
  });

  // "Laissez-nous un avis sur"
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.text("Laissez-nous un avis sur", stickerCX, stickerCY - r * 0.22, {
    align: "center",
  });

  // "Google" coloré
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  const letters: { c: string; color: [number, number, number] }[] = [
    { c: "G", color: [66, 133, 244] },
    { c: "o", color: [234, 67, 53] },
    { c: "o", color: [251, 188, 5] },
    { c: "g", color: [66, 133, 244] },
    { c: "l", color: [52, 168, 83] },
    { c: "e", color: [234, 67, 53] },
  ];
  const totalW = letters.reduce((s, l) => s + pdf.getTextWidth(l.c), 0);
  let lx = stickerCX - totalW / 2;
  const gY = stickerCY - r * 0.02;
  for (const l of letters) {
    pdf.setTextColor(l.color[0], l.color[1], l.color[2]);
    pdf.text(l.c, lx, gY);
    lx += pdf.getTextWidth(l.c);
  }

  // 5 étoiles dessinées (polygones)
  const starR = 2.2;
  const starGap = 1.4;
  const totalStarsW = 5 * (starR * 2) + 4 * starGap;
  let sx = stickerCX - totalStarsW / 2 + starR;
  const sy = stickerCY + r * 0.12;
  for (let i = 0; i < 5; i++) {
    drawStar(pdf, sx, sy, starR, [251, 188, 5]);
    sx += starR * 2 + starGap;
  }

  // QR code
  const qrUrl = client.reviewUrl || "https://ranki.ai";
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: "H",
  });
  const qrSize = r * 0.5;
  pdf.addImage(
    qrDataUrl,
    "PNG",
    stickerCX - qrSize / 2,
    stickerCY + r * 0.22,
    qrSize,
    qrSize,
  );

  // Pub Ranki.ai
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(13, 148, 136);
  pdf.text("ranki.ai", stickerCX, stickerCY + r * 0.86, { align: "center" });

  // ====== LETTRE (droite) — agrandie ======
  const letterX = margin + stickerSize + 6;
  const letterW = pageW - letterX - margin;
  let ly = yOffset + 8;

  // Badge OFFERT + logo
  pdf.setFillColor(13, 148, 136);
  pdf.roundedRect(letterX, ly, 24, 7, 1.5, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("OFFERT", letterX + 12, ly + 5, { align: "center" });

  pdf.setTextColor(13, 148, 136);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Ranki.ai", letterX + 30, ly + 5.5);

  ly += 13;

  // Salutation
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  const greetLines = pdf.splitTextToSize(`Bonjour ${client.businessName},`, letterW);
  pdf.text(greetLines, letterX, ly);
  ly += greetLines.length * 5.5 + 1;

  // Intro
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  const ratingPart =
    client.rating && client.reviewsCount
      ? ` (vu vos ${client.rating}★ et ${client.reviewsCount} avis Google)`
      : client.rating
      ? ` (vu vos ${client.rating}★ sur Google)`
      : "";
  const intro = `Nous vous offrons une carte NFC + QR personnalisée à votre nom${ratingPart} pour collecter plus d'avis Google sans aucun effort de votre part.`;
  const introLines = pdf.splitTextToSize(intro, letterW);
  pdf.text(introLines, letterX, ly);
  ly += introLines.length * 4.5 + 4;

  // OPTION 1
  const optH = 17;
  pdf.setFillColor(236, 253, 245);
  pdf.setDrawColor(13, 148, 136);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(letterX, ly, letterW, optH, 2.5, 2.5, "FD");
  pdf.setFillColor(13, 148, 136);
  pdf.roundedRect(letterX + 3, ly + 2.5, 20, 5.5, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text("OPTION 1", letterX + 13, ly + 6.2, { align: "center" });
  pdf.setTextColor(13, 148, 136);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text("Auto-Reply aux avis Google", letterX + 26, ly + 7);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(
    "L'IA répond automatiquement à tous vos avis 24/7.",
    letterX + 3,
    ly + 13.5,
  );
  ly += optH + 3;

  // OPTION 2
  pdf.setFillColor(254, 249, 231);
  pdf.setDrawColor(245, 158, 11);
  pdf.roundedRect(letterX, ly, letterW, optH, 2.5, 2.5, "FD");
  pdf.setFillColor(245, 158, 11);
  pdf.roundedRect(letterX + 3, ly + 2.5, 20, 5.5, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text("OPTION 2", letterX + 13, ly + 6.2, { align: "center" });
  pdf.setTextColor(180, 110, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text("Visibilité GEO + SEO local", letterX + 26, ly + 7);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(
    "Posts GMB automatiques + suivi classement Maps.",
    letterX + 3,
    ly + 13.5,
  );
  ly += optH + 5;

  // CTA (avec splitTextToSize pour éviter la coupure)
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  const ctaLines = pdf.splitTextToSize(
    "→ Scannez le QR à gauche ou rendez-vous sur ranki.ai",
    letterW,
  );
  pdf.text(ctaLines, letterX, ly);
  ly += ctaLines.length * 4.5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(110, 110, 110);
  pdf.text("Dès 0 €/mois · sans engagement", letterX, ly + 1);

  // séparateur pointillés
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(margin, yOffset + blockH, pageW - margin, yOffset + blockH);
  pdf.setLineDashPattern([], 0);
}

export async function generateProspectionPDF(
  clients: ProspectClient[],
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const blockH = pageH / 2;

  pdf.setFillColor(13, 148, 136);
  pdf.rect(0, 0, pageW, 3, "F");

  const list = clients.slice(0, 2);
  for (let i = 0; i < list.length; i++) {
    await drawClientBlock(pdf, list[i], i * blockH + 4, pageW, blockH - 4);
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    "Ranki.ai · L'assistant IA pour vos avis Google · contact@ranki.ai",
    pageW / 2,
    pageH - 4,
    { align: "center" },
  );

  return pdf;
}

export async function downloadProspectionPDF(
  clients: ProspectClient[] | ProspectClient,
  filename?: string,
) {
  const list = Array.isArray(clients) ? clients : [clients];
  const pdf = await generateProspectionPDF(list);
  const name =
    filename ||
    `ranki-prospection-${list[0]?.businessName
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()}.pdf`;
  pdf.save(name);
}
