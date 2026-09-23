import { useEffect, useState } from 'react';

export interface ExtractedPalette {
  primary: string;
  glow: string;
  bgStart: string;
  bgEnd: string;
}

const DEFAULT_PALETTE: ExtractedPalette = {
  primary: '#ef4444',
  glow: 'rgba(239, 68, 68, 0.4)',
  bgStart: '#140c10',
  bgEnd: '#08080a',
};

export function useColorExtractor(imageUrl?: string): ExtractedPalette {
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);

  useEffect(() => {
    if (!imageUrl) {
      setPalette(DEFAULT_PALETTE);
      applyPalette(DEFAULT_PALETTE);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample at 48x48 for fast processing
        canvas.width = 48;
        canvas.height = 48;
        ctx.drawImage(img, 0, 0, 48, 48);

        const imgData = ctx.getImageData(0, 0, 48, 48).data;
        const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          // Skip pure black and pure white
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 25 || brightness > 235) continue;

          // Calculate saturation: max - min
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          // Quantize to 16 color steps
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          const existing = colorBuckets.get(key);
          const score = (saturation * 2 + 0.5) * (brightness > 60 && brightness < 200 ? 1.5 : 1);

          if (existing) {
            existing.count += 1;
            existing.score += score;
          } else {
            colorBuckets.set(key, { r: qr, g: qg, b: qb, count: 1, score });
          }
        }

        let bestColor = { r: 239, g: 68, b: 68 }; // fallback red
        let maxScore = -1;

        for (const val of colorBuckets.values()) {
          if (val.score > maxScore) {
            maxScore = val.score;
            bestColor = { r: val.r, g: val.g, b: val.b };
          }
        }

        // Boost vibrancy if needed
        const { r, g, b } = bestColor;
        const primary = `rgb(${r}, ${g}, ${b})`;
        const glow = `rgba(${r}, ${g}, ${b}, 0.45)`;

        // Dark background tint derived from color
        const darkR = Math.max(8, Math.round(r * 0.12));
        const darkG = Math.max(8, Math.round(g * 0.12));
        const darkB = Math.max(12, Math.round(b * 0.15));
        const bgStart = `rgb(${darkR}, ${darkG}, ${darkB})`;
        const bgEnd = '#060608';

        const newPalette: ExtractedPalette = { primary, glow, bgStart, bgEnd };
        setPalette(newPalette);
        applyPalette(newPalette);
      } catch (err) {
        console.warn('Color extraction failed:', err);
      }
    };

    img.onerror = () => {
      setPalette(DEFAULT_PALETTE);
      applyPalette(DEFAULT_PALETTE);
    };
  }, [imageUrl]);

  return palette;
}

function applyPalette(palette: ExtractedPalette) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', palette.primary);
  root.style.setProperty('--theme-glow', palette.glow);
  root.style.setProperty('--theme-bg-start', palette.bgStart);
  root.style.setProperty('--theme-bg-end', palette.bgEnd);
}
