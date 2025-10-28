/*
  Selects "rock vibe" images from skku_lcda/ and writes curated gallery
  to public/club/{1..6}.jpg. Heuristics favor: high contrast, high color
  variance, red/black dominance. Filters out: green-dominant, low-saturation.
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '..', 'skku_lcda');
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'club');
const COUNT = 6;

async function scoreImage(file) {
  try {
    const img = sharp(file).removeAlpha();
    const stats = await img.stats();
    const { channels } = stats; // [R,G,B]
    const [R, G, B] = channels;
    const meanR = R.mean, meanG = G.mean, meanB = B.mean;
    const sdevR = R.stdev, sdevG = G.stdev, sdevB = B.stdev;

    const brightness = (meanR + meanG + meanB) / 3;
    const colorVariance = (sdevR + sdevG + sdevB) / 3;
    const contrast = stats.entropy * 100; // proxy for detail
    const redBias = meanR - (meanG + meanB) / 2;
    const greenBias = meanG - (meanR + meanB) / 2;

    // base score emphasizing contrast and color variance
    let score = contrast * 0.7 + colorVariance * 0.9 + redBias * 0.25;

    // penalize too bright or too dark extremes slightly
    if (brightness > 220 || brightness < 20) score -= 10;

    // penalize green-dominant (summer hobby poster)
    if (greenBias > 12) score -= 90; // strongly penalize green-dominant

    // penalize low colorfulness (likely text list)
    if (colorVariance < 30) score -= 45; // likely text list or flat poster

    return { file, score, brightness, colorVariance, redBias, greenBias };
  } catch (e) {
    return { file, score: -Infinity };
  }
}

async function main() {
  const all = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(SRC_DIR, f));
  if (all.length === 0) {
    console.error('No images found in', SRC_DIR);
    process.exit(1);
  }

  const scored = await Promise.all(all.map(scoreImage));
  const filtered = scored
    .filter((s) => isFinite(s.score))
    // Avoid near-duplicates by preferring newer files first
    .sort((a, b) => b.score - a.score);

  const pick = filtered.slice(0, COUNT);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let i = 0; i < pick.length; i++) {
    const src = pick[i].file;
    const out = path.join(OUT_DIR, `${i + 1}.jpg`);
    await sharp(src).jpeg({ quality: 86 }).toFile(out);
    console.log('Selected', src, '->', out, 'score:', pick[i].score.toFixed(2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
