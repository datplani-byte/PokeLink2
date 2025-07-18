const https = require('https');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-iv/heartgold-soulsilver/';
const outputDir = path.resolve(__dirname, '../frontend/public/sprites');

// English to German type mapping for Gen IV
const typeNames = [
  { en: 'normal', de: 'Normal' },
  { en: 'fighting', de: 'Kampf' },
  { en: 'flying', de: 'Flug' },
  { en: 'poison', de: 'Gift' },
  { en: 'ground', de: 'Boden' },
  { en: 'rock', de: 'Gestein' },
  { en: 'bug', de: 'Käfer' },
  { en: 'ghost', de: 'Geist' },
  { en: 'steel', de: 'Stahl' },
  { en: 'fire', de: 'Feuer' },
  { en: 'water', de: 'Wasser' },
  { en: 'grass', de: 'Pflanze' },
  { en: 'electric', de: 'Elektro' },
  { en: 'psychic', de: 'Psycho' },
  { en: 'ice', de: 'Eis' },
  { en: 'dragon', de: 'Drache' },
  { en: 'dark', de: 'Unlicht' }
];

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadTypeIconByGermanName(number, deName) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${number}.png`;
    const filePath = path.join(outputDir, `${deName}.png`);
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

async function downloadAllTypeIconsByGermanName() {
  for (let i = 0; i < typeNames.length; i++) {
    const number = i + 1;
    const deName = typeNames[i].de;
    try {
      await downloadTypeIconByGermanName(number, deName);
      console.log(`Downloaded ${deName}.png`);
    } catch (err) {
      console.error(`Error downloading ${deName}:`, err.message);
    }
  }
}

if (require.main === module) {
  downloadAllTypeIconsByGermanName();
} 