import QRCode from "qrcode";

export type ImgLang = "fr" | "en";

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

function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOut: number, rIn: number) {
  const quarters: [string, number][] = [
    [G.red, -135],
    [G.yellow, -45],
    [G.green, 45],
    [G.blue, 135],
  ];
  for (const [color, startDeg] of quarters) {
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, s, e, false);
    ctx.arc(cx, cy, rIn, e, s, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

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
  const size = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const rOut = size / 2 - 20;
  const ringW = 55;
  const rIn = rOut - ringW;

  drawRing(ctx, cx, cy, rOut, rIn);
  ctx.beginPath();
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const t = T[lang];

  ctx.fillStyle = "#1e1e1e";
  ctx.font = "italic 38px 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText(t.top, cx, cy - rIn + 80);

  // Google word
  const letters = ["G", "o", "o", "g", "l", "e"];
  const colors = [G.blue, G.red, G.yellow, G.blue, G.green, G.red];
  ctx.font = "bold 110px Arial, sans-serif";
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let xc = cx - total / 2;
  const gy = cy - rIn + 200;
  letters.forEach((l, i) => {
    ctx.fillStyle = colors[i];
    ctx.textAlign = "left";
    ctx.fillText(l, xc, gy);
    xc += widths[i];
  });

  ctx.fillStyle = "#141414";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.cta1, cx, gy + 60);
  ctx.fillText(t.cta2, cx, gy + 98);

  // stars
  const starY = gy + 150;
  const starSize = 22;
  const gap = starSize * 2.6;
  const startX = cx - (4 * gap) / 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, startX + i * gap, starY, starSize, starSize * 0.45);
  }

  // QR
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 800,
    margin: 0,
    errorCorrectionLevel: "H",
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = rIn * 0.85;
  ctx.drawImage(qrImg, cx - qrSize / 2, starY + 40, qrSize, qrSize);

  // Footer: Ranki.ai
  const footerY = cy + rIn - 90;
  try {
    const fav = await loadImage("/favicon.png");
    const iconS = 60;
    ctx.font = "bold 56px Arial, sans-serif";
    const rankiW = ctx.measureText("Ranki").width;
    const dotW = ctx.measureText(".ai").width;
    const gap2 = 12;
    const totalW = iconS + gap2 + rankiW + dotW;
    let cur = cx - totalW / 2;
    ctx.drawImage(fav, cur, footerY - iconS / 2, iconS, iconS);
    cur += iconS + gap2;
    ctx.fillStyle = "#1e1e1e";
    ctx.textAlign = "left";
    ctx.fillText("Ranki", cur, footerY + 18);
    ctx.fillStyle = G.blue;
    ctx.fillText(".ai", cur + rankiW, footerY + 18);
  } catch {
    ctx.fillStyle = "#1e1e1e";
    ctx.font = "bold 56px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Ranki.ai", cx, footerY + 18);
  }

  ctx.fillStyle = "#787878";
  ctx.font = "22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.tagline, cx, footerY + 60);

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
