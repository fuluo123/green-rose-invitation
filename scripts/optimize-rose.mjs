import sharp from 'sharp';
// Preserve the original artwork; generate delivery assets only.
await sharp('src/assets/rose-fine-art.png').resize({ width: 720 })
  .webp({ quality: 82, alphaQuality: 65, effort: 6 }).toFile('src/assets/rose-fine-art.webp');
await sharp('src/assets/rose-fine-art.png').resize({ width: 64 })
  .webp({ quality: 36, alphaQuality: 50, effort: 6 }).toFile('src/assets/rose-preview.webp');
