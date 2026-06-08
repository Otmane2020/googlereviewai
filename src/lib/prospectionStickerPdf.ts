import jsPDF from "jspdf";
import QRCode from "qrcode";

interface ProspectionStickerArgs {
  businessName: string;
  placeId: string;
  copies?: number; // 1, 2 or 4 stickers per A4
}

const GOOGLE_COLORS = {
  blue: [66, 133, 244],
  red: [234, 67, 53],
  yellow: [251, 188, 5],
  green: [52, 168, 83],
};

function drawGoogleRing(
  pdf: jsPDF,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
) {
  // Approximation des 4 quartiers de couleurs Google avec des arcs (jsPDF n'a pas d'arc natif fiable)
  // On dessine 4 secteurs comme polygones approximés.
  const segments = 60; // par quartier
  const quarters = [
    { color: GOOGLE_COLORS.red, start: -135 },
    { color: GOOGLE_COLORS.yellow, start: -45 },
    { color: GOOGLE_COLORS.green, start: 45 },
    { color: GOOGLE_COLORS.blue, start: 135 },
  ];

  for (const q of quarters) {
    const pts: [number, number][] = [];
    const startRad = (q.start * Math.PI) / 180;
    const endRad = ((q.start + 90) * Math.PI) / 180;

    // arc externe
    for (let i = 0; i <= segments; i++) {
      const a = startRad + ((endRad - startRad) * i) / segments;
      pts.push([cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)]);
    }
    // arc interne (retour)
    for (let i = segments; i >= 0; i--) {
      const a = startRad + ((endRad - startRad) * i) / segments;
      pts.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
    }

    pdf.setFillColor(q.color[0], q.color[1], q.color[2]);
    // Trace polygone
    const lines: [number, number][] = pts.slice(1).map((p, i) => [
      p[0] - pts[i][0],
      p[1] - pts[i][1],
    ]);
    pdf.lines(lines, pts[0][0], pts[0][1], [1, 1], "F", true);
  }
}

export async function generateProspectionStickerPDF({
  businessName,
  placeId,
  copies = 4,
}: ProspectionStickerArgs): Promise<jsPDF> {
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 800,
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;

  // Layout: 2x2 par défaut, ou 1x1 / 1x2
  let cols = 2;
  let rows = 2;
  if (copies === 1) { cols = 1; rows = 1; }
  else if (copies === 2) { cols = 1; rows = 2; }
  else { copies = 4; cols = 2; rows = 2; }

  const cellW = pageW / cols;
  const cellH = pageH / rows;
  const stickerD = Math.min(cellW, cellH) - 14; // diamètre en mm
  const ringW = 6; // largeur de l'anneau Google

  for (let i = 0; i < copies; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2;
    const outerR = stickerD / 2;
    const innerR = outerR - ringW;

    // Anneau Google
    drawGoogleRing(pdf, cx, cy, outerR, innerR);

    // Fond blanc à l'intérieur
    pdf.setFillColor(255, 255, 255);
    pdf.circle(cx, cy, innerR, "F");

    // "Laissez-nous"
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("times", "italic");
    pdf.setFontSize(14);
    pdf.text("Laissez-nous votre avis sur", cx, cy - innerR + 12, { align: "center" });

    // "Google" multicolore
    const googleY = cy - innerR + 22;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    const letters = ["G", "o", "o", "g", "l", "e"];
    const colors = [
      GOOGLE_COLORS.blue,
      GOOGLE_COLORS.red,
      GOOGLE_COLORS.yellow,
      GOOGLE_COLORS.blue,
      GOOGLE_COLORS.green,
      GOOGLE_COLORS.red,
    ];
    // Largeur totale approximative
    const widths = letters.map((l) => pdf.getTextWidth(l));
    const totalW = widths.reduce((a, b) => a + b, 0);
    let xCursor = cx - totalW / 2;
    letters.forEach((l, idx) => {
      pdf.setTextColor(colors[idx][0], colors[idx][1], colors[idx][2]);
      pdf.text(l, xCursor, googleY);
      xCursor += widths[idx];
    });

    // Phrase d'action
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("MERCI DE PRENDRE UNE MINUTE", cx, googleY + 7, { align: "center" });
    pdf.text("POUR NOUS LAISSER UN AVIS !", cx, googleY + 11.5, { align: "center" });

    // Étoiles
    pdf.setTextColor(GOOGLE_COLORS.yellow[0], GOOGLE_COLORS.yellow[1], GOOGLE_COLORS.yellow[2]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("★ ★ ★ ★ ★", cx, googleY + 19, { align: "center" });

    // QR code (centré, sous les étoiles)
    const qrSize = innerR * 0.95;
    const qrX = cx - qrSize / 2;
    const qrY = googleY + 22;
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Mention Ranki.ai en bas, à l'intérieur du cercle
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text("Ranki.ai", cx, cy + innerR - 8, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.text("Répondeur automatique d'avis Google par IA", cx, cy + innerR - 5, {
      align: "center",
    });
  }

  // Pied de page (hors stickers, marge bas)
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  const safeName = businessName.length > 60 ? businessName.slice(0, 58) + "…" : businessName;
  pdf.text(`Ranki.ai · ${safeName} · place_id: ${placeId}`, 10, pageH - 4);

  return pdf;
}

export async function downloadProspectionStickerPDF(
  args: ProspectionStickerArgs,
  filename = "ranki-sticker.pdf",
) {
  const pdf = await generateProspectionStickerPDF(args);
  pdf.save(filename);
}
