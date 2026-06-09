import QRCode from "qrcode";

export type ImgLang = "fr" | "en";

// Branded Label Gelato format: 7.62 x 10.16 cm (vertical rectangle, 3x4")
// 300 DPI export → 900 x 1200 px
const G = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
};

const T = {
  fr: {
    top: "Laissez-nous votre avis sur",
    cta1: "MERCI DE PRENDRE UNE MINUTE",
    cta2: "POUR NOUS LAISSER UN AVIS !",
    tagline: "Répondeur IA d'avis Google",
  },
  en: {
    top: "Leave us your review on",
    cta1: "TAKE A MINUTE TO LEAVE",
    cta2: "US A REVIEW - THANK YOU !",
    tagline: "AI Google reviews assistant",
  },
};

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOut: number, rIn: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = G.yellow;
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadStickerImage(
  placeId: string,
  businessName: string,
  lang: ImgLang = "fr",
) {
  // Vertical rectangle 7.62 x 10.16 cm @ 300dpi
  const W = 900;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Outer rounded border (4 Google colors as a top accent bar)
  const barH = 14;
  const seg = W / 4;
  const cols = [G.blue, G.red, G.yellow, G.green];
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * seg, 0, seg, barH);
  });
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * seg, H - barH, seg, barH);
  });

  const t = T[lang];
  const cx = W / 2;

  // Top label
  ctx.fillStyle = "#1e1e1e";
  ctx.font = "italic 34px 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText(t.top, cx, 80);

  // Google word
  const letters = ["G", "o", "o", "g", "l", "e"];
  const colors = [G.blue, G.red, G.yellow, G.blue, G.green, G.red];
  ctx.font = "bold 110px Arial, sans-serif";
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let xc = cx - total / 2;
  const gy = 180;
  letters.forEach((l, i) => {
    ctx.fillStyle = colors[i];
    ctx.textAlign = "left";
    ctx.fillText(l, xc, gy);
    xc += widths[i];
  });

  // 5 stars
  const starY = gy + 50;
  const starSize = 26;
  const gap = starSize * 2.6;
  const startX = cx - (4 * gap) / 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, startX + i * gap, starY, starSize, starSize * 0.45);
  }

  // CTA
  ctx.fillStyle = "#141414";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.cta1, cx, starY + 60);
  ctx.fillText(t.cta2, cx, starY + 98);

  // QR — big centered square
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 900,
    margin: 0,
    errorCorrectionLevel: "H",
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 560;
  const qrX = cx - qrSize / 2;
  const qrY = starY + 130;

  // Subtle frame around QR
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 2;
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 18);
  ctx.stroke();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Footer: Ranki.ai
  const footerY = qrY + qrSize + 70;
  try {
    const fav = await loadImage("/favicon.png");
    const iconS = 54;
    ctx.font = "bold 50px Arial, sans-serif";
    const rankiW = ctx.measureText("Ranki").width;
    const dotW = ctx.measureText(".ai").width;
    const gap2 = 12;
    const totalW = iconS + gap2 + rankiW + dotW;
    let cur = cx - totalW / 2;
    ctx.drawImage(fav, cur, footerY - iconS / 2 - 4, iconS, iconS);
    cur += iconS + gap2;
    ctx.fillStyle = "#1e1e1e";
    ctx.textAlign = "left";
    ctx.fillText("Ranki", cur, footerY + 14);
    ctx.fillStyle = G.blue;
    ctx.fillText(".ai", cur + rankiW, footerY + 14);
  } catch {
    ctx.fillStyle = "#1e1e1e";
    ctx.font = "bold 50px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Ranki.ai", cx, footerY + 14);
  }

  ctx.fillStyle = "#787878";
  ctx.font = "22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.tagline, cx, footerY + 54);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sticker-${businessName.replace(/[^a-z0-9]/gi, "_").slice(0, 30)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
