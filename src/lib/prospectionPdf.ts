import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface ProspectClient {
  businessName: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  reviewUrl?: string;
}

interface ProspectionPdfArgs extends ProspectClient {}

/**
 * Dessine UNE fiche (sticker rond style "Lemon Labels" à gauche + lettre à droite).
 * Occupe la moitié haute ou basse d'une page A4.
 */
async function drawClientBlock(
  pdf: jsPDF,
  client: ProspectClient,
  yOffset: number,
  pageW: number,
  blockH: number,
) {
  const margin = 10;
  const stickerSize = Math.min(blockH - 14, 110);
  const stickerCX = margin + stickerSize / 2 + 2;
  const stickerCY = yOffset + blockH / 2;
  const r = stickerSize / 2;

  // ====== STICKER ROND (gauche) ======
  // Fond blanc
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(230, 230, 230);
  pdf.circle(stickerCX, stickerCY, r, "FD");

  // Arcs Google colorés (4 quartiers)
  // jsPDF n'a pas d'arc natif simple: on simule avec 4 secteurs via cercles épais clippés.
  // Approche simple: 4 anneaux partiels dessinés avec setLineWidth + lignes courbes approximées.
  const ringW = 4;
  const drawArc = (
    startDeg: number,
    endDeg: number,
    color: [number, number, number],
  ) => {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(ringW);
    const steps = 40;
    const step = (endDeg - startDeg) / steps;
    let prev: [number, number] | null = null;
    for (let i = 0; i <= steps; i++) {
      const a = ((startDeg + step * i) * Math.PI) / 180;
      const x = stickerCX + Math.cos(a) * (r - ringW / 2);
      const y = stickerCY + Math.sin(a) * (r - ringW / 2);
      if (prev) pdf.line(prev[0], prev[1], x, y);
      prev = [x, y];
    }
  };
  drawArc(-135, -45, [234, 67, 53]); // rouge (haut)
  drawArc(-45, 45, [66, 133, 244]); // bleu (droite)
  drawArc(45, 135, [52, 168, 83]); // vert (bas)
  drawArc(135, 225, [251, 188, 5]); // jaune (gauche)
  pdf.setLineWidth(0.2);

  // Nom établissement (en haut du sticker, tronqué)
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  const name =
    client.businessName.length > 22
      ? client.businessName.slice(0, 21) + "…"
      : client.businessName;
  pdf.text(name, stickerCX, stickerCY - r * 0.55, { align: "center" });

  // "Please Leave Us A Review On"
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(40, 40, 40);
  pdf.text("Laissez-nous un avis sur", stickerCX, stickerCY - r * 0.35, {
    align: "center",
  });

  // "Google" coloré
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
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
  const gY = stickerCY - r * 0.12;
  for (const l of letters) {
    pdf.setTextColor(l.color[0], l.color[1], l.color[2]);
    pdf.text(l.c, lx, gY);
    lx += pdf.getTextWidth(l.c);
  }

  // Étoiles
  pdf.setTextColor(251, 188, 5);
  pdf.setFontSize(11);
  pdf.text("★ ★ ★ ★ ★", stickerCX, stickerCY + r * 0.05, { align: "center" });

  // QR code
  const qrUrl =
    client.reviewUrl || "https://ranki.ai";
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: "H",
  });
  const qrSize = r * 0.55;
  pdf.addImage(
    qrDataUrl,
    "PNG",
    stickerCX - qrSize / 2,
    stickerCY + r * 0.1,
    qrSize,
    qrSize,
  );

  // Pub Ranki.ai sous le QR
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(13, 148, 136);
  pdf.text("ranki.ai", stickerCX, stickerCY + r * 0.82, { align: "center" });

  // ====== LETTRE (droite) ======
  const letterX = margin + stickerSize + 8;
  const letterW = pageW - letterX - margin;
  let ly = yOffset + 8;

  // Badge "OFFERT"
  pdf.setFillColor(13, 148, 136);
  pdf.roundedRect(letterX, ly, 22, 6, 1.5, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text("OFFERT", letterX + 11, ly + 4.2, { align: "center" });

  // Logo Ranki
  pdf.setTextColor(13, 148, 136);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Ranki.ai", letterX + 28, ly + 5);

  ly += 12;

  // Titre
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(`Bonjour ${client.businessName},`, letterX, ly);
  ly += 5.5;

  // Intro
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.8);
  pdf.setTextColor(60, 60, 60);
  const intro = `Nous vous offrons une carte NFC + QR personnalisée à votre nom${
    client.rating ? ` (vu vos ${client.rating}★ sur Google` : ""
  }${
    client.reviewsCount ? `, ${client.reviewsCount} avis)` : client.rating ? ")" : ""
  } pour collecter plus d'avis Google sans effort.`;
  const introLines = pdf.splitTextToSize(intro, letterW);
  pdf.text(introLines, letterX, ly);
  ly += introLines.length * 4 + 3;

  // Option 1 — Auto Reply
  pdf.setFillColor(236, 253, 245);
  pdf.setDrawColor(13, 148, 136);
  pdf.roundedRect(letterX, ly, letterW, 14, 2, 2, "FD");
  // tag
  pdf.setFillColor(13, 148, 136);
  pdf.roundedRect(letterX + 2, ly + 2, 18, 4.5, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.text("OPTION 1", letterX + 11, ly + 5.3, { align: "center" });
  // titre
  pdf.setTextColor(13, 148, 136);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Auto-Reply aux avis Google", letterX + 23, ly + 6);
  // desc
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(
    "L'IA répond automatiquement à tous vos avis 24/7.",
    letterX + 2,
    ly + 11,
  );
  ly += 17;

  // Option 2 — GEO / SEO
  pdf.setFillColor(254, 249, 231);
  pdf.setDrawColor(245, 158, 11);
  pdf.roundedRect(letterX, ly, letterW, 14, 2, 2, "FD");
  pdf.setFillColor(245, 158, 11);
  pdf.roundedRect(letterX + 2, ly + 2, 18, 4.5, 1, 1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.text("OPTION 2", letterX + 11, ly + 5.3, { align: "center" });
  pdf.setTextColor(180, 110, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Visibilité GEO + SEO local", letterX + 23, ly + 6);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(
    "Posts GMB automatiques + suivi classement Maps.",
    letterX + 2,
    ly + 11,
  );
  ly += 18;

  // CTA
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("→ Scannez le QR à gauche ou visitez ranki.ai", letterX, ly);
  ly += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(110, 110, 110);
  pdf.text("Dès 0 €/mois · sans engagement", letterX, ly + 3);

  // ligne de séparation entre 2 fiches
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(margin, yOffset + blockH, pageW - margin, yOffset + blockH);
  pdf.setLineDashPattern([], 0);
}

/**
 * Génère un PDF A4 contenant 1 ou 2 fiches prospect (haut + bas).
 */
export async function generateProspectionPDF(
  clients: ProspectClient[],
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const blockH = pageH / 2;

  // Header fin emerald
  pdf.setFillColor(13, 148, 136);
  pdf.rect(0, 0, pageW, 3, "F");

  const list = clients.slice(0, 2);
  for (let i = 0; i < list.length; i++) {
    await drawClientBlock(pdf, list[i], i * blockH + 4, pageW, blockH - 4);
  }

  // Footer
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
