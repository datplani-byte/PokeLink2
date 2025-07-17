const fs = require('fs');
const path = require('path');
const https = require('https');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const SPRITES_DIR = path.join(__dirname, '../frontend/public/sprites');

async function fetchTotalPokemon() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${POKEAPI_BASE}/pokemon-species?limit=1`);
  const data = await res.json();
  return data.count;
}

function downloadSprite(pokedexId) {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
    const dest = path.join(SPRITES_DIR, `${pokedexId}.png`);
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(false); // sprite not found
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

async function main() {
  if (!fs.existsSync(SPRITES_DIR)) {
    fs.mkdirSync(SPRITES_DIR);
  }
  const total = await fetchTotalPokemon();
  for (let id = 1; id <= total; id++) {
    await downloadSprite(id);
    if (id % 50 === 0) console.log(`Downloaded ${id} sprites...`);
  }
  console.log(`Downloaded sprites for ${total} Pokémon.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 