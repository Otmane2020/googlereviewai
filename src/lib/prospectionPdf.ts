import jsPDF from "jspdf";
import QRCode from "qrcode";

interface ProspectionPdfArgs {
  businessName: string;
  address?: string;
  reviewUrl?: string; // URL Google review (fallback: ranki.ai)
}

/**
 * Génère un PDF A4 :
 *  - Page 1 : lettre personnalisée expliquant le cadeau (carte NFC/QR offerte) + options
 *  - Page 2 : aperçu visuel de la carte avec QR code + mention "Ranki.ai"
 */
export async function generateProspectionPDF({
  businessName,
  address,
  reviewUrl,
}: ProspectionPdfArgs): Promise<jsPDF> {
  const url = reviewUrl || "https://ranki.ai";
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;

  // ============== PAGE 1 : LETTRE ==============
  // Header
  pdf.setFillColor(13, 148, 136); // emerald
  pdf.rect(0, 0, pageW, 8, "F");

  pdf.setTextColor(13, 148, 136);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("Ranki.ai", margin, 25);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text("L'assistant IA pour vos avis Google", margin, 31);

  // Destinataire
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(`À l'attention de : ${businessName}`, margin, 50);
  if (address) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    const addrLines = pdf.splitTextToSize(address, pageW - margin * 2);
    pdf.text(addrLines, margin, 56);
  }

  // Objet
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Objet : Un cadeau pour booster votre visibilité Google", margin, 75);

  // Corps
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(50, 50, 50);

  const body = `Bonjour,

Nous avons remarqué votre établissement et nous sommes convaincus que vous méritez plus d'avis Google positifs. C'est pourquoi nous vous offrons en cadeau une carte NFC + QR Code personnalisée à votre nom, prête à être posée sur votre comptoir.

Vos clients n'ont qu'à approcher leur téléphone (NFC) ou scanner le QR code pour laisser un avis Google en 10 secondes — sans application, sans friction.

Ce que vous obtenez :
   • Plus d'avis 5 étoiles, sans effort de votre part
   • Un meilleur classement sur Google Maps (SEO local)
   • Une image moderne et professionnelle auprès de vos clients
   • Des réponses automatiques à vos avis grâce à notre IA (option)

Options disponibles avec Ranki.ai :
   • Carte NFC + QR personnalisée (offerte avec l'essai)
   • Réponses IA automatiques à vos avis Google 24/7
   • Posts GMB automatiques (SEO local)
   • Suivi de votre classement Maps en temps réel
   • Dès 0 € / mois — sans engagement

Pour activer votre cadeau et découvrir Ranki.ai, scannez simplement le QR code au verso ou rendez-vous sur ranki.ai.

À très vite,
L'équipe Ranki.ai`;

  const bodyLines = pdf.splitTextToSize(body, pageW - margin * 2);
  pdf.text(bodyLines, margin, 85);

  // Footer page 1
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Ranki.ai · contact@ranki.ai · ranki.ai", margin, pageH - 12);

  // ============== PAGE 2 : APERÇU CARTE ==============
  pdf.addPage();

  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Aperçu de votre carte personnalisée", pageW / 2, 25, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(110, 110, 110);
  pdf.text("Format carte de visite — NFC + QR Code", pageW / 2, 32, { align: "center" });

  // Carte (style screenshot)
  const cardW = 85;
  const cardH = 130;
  const cardX = (pageW - cardW) / 2;
  const cardY = 45;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "FD");

  // "Google" (colored)
  let cursorY = cardY + 14;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  const letters = [
    { c: "G", color: [66, 133, 244] },
    { c: "o", color: [234, 67, 53] },
    { c: "o", color: [251, 188, 5] },
    { c: "g", color: [66, 133, 244] },
    { c: "l", color: [52, 168, 83] },
    { c: "e", color: [234, 67, 53] },
  ];
  const totalW = letters.reduce((s, l) => s + pdf.getTextWidth(l.c), 0);
  let lx = cardX + (cardW - totalW) / 2;
  for (const l of letters) {
    pdf.setTextColor(l.color[0], l.color[1], l.color[2]);
    pdf.text(l.c, lx, cursorY);
    lx += pdf.getTextWidth(l.c);
  }

  // Étoiles
  cursorY += 7;
  pdf.setTextColor(251, 188, 5);
  pdf.setFontSize(13);
  pdf.text("★ ★ ★ ★ ★", cardX + cardW / 2, cursorY, { align: "center" });

  // Texte
  cursorY += 7;
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("LAISSEZ-MOI UN AVIS", cardX + cardW / 2, cursorY, { align: "center" });

  cursorY += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text("APPROCHEZ VOTRE TÉLÉPHONE", cardX + cardW / 2, cursorY, { align: "center" });
  cursorY += 3.5;
  pdf.text("OU SCANNEZ LE QR CODE", cardX + cardW / 2, cursorY, { align: "center" });

  // NFC
  cursorY += 6;
  pdf.setFontSize(6);
  pdf.setTextColor(80, 80, 80);
  pdf.text("((  NFC  ))", cardX + cardW / 2, cursorY, { align: "center" });

  // QR
  const qrSize = 50;
  const qrX = cardX + (cardW - qrSize) / 2;
  const qrY = cursorY + 4;
  pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Mention "Ranki.ai" SOUS LA CARTE
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(13, 148, 136);
  pdf.text("Ranki.ai", pageW / 2, cardY + cardH + 12, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Carte personnalisée pour : ${businessName}`,
    pageW / 2,
    cardY + cardH + 18,
    { align: "center" }
  );

  // Footer page 2
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Ranki.ai · contact@ranki.ai · ranki.ai", margin, pageH - 12);

  return pdf;
}

export async function downloadProspectionPDF(
  args: ProspectionPdfArgs,
  filename?: string,
) {
  const pdf = await generateProspectionPDF(args);
  const name =
    filename ||
    `ranki-prospection-${args.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  pdf.save(name);
}
