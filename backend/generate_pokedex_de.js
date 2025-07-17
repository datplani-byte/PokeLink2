const fs = require('fs');
const path = require('path');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const OUTPUT_PATH = path.join(__dirname, '../frontend/public/pokedex_de.json');

async function fetchAllPokemon(fetch) {
  // Get total count
  const countRes = await fetch(`${POKEAPI_BASE}/pokemon-species?limit=1`);
  const countData = await countRes.json();
  const total = countData.count;

  // Get all species URLs
  const res = await fetch(`${POKEAPI_BASE}/pokemon-species?limit=${total}`);
  const data = await res.json();
  return data.results;
}

async function fetchGermanName(fetch, speciesUrl) {
  const res = await fetch(speciesUrl);
  const data = await res.json();
  const deName = data.names.find(n => n.language.name === 'de');
  return deName ? deName.name : data.name;
}

async function fetchTypes(fetch, pokemonUrl) {
  const res = await fetch(pokemonUrl);
  const data = await res.json();
  const types = data.types.sort((a, b) => a.slot - b.slot).map(t => t.type.name);
  return types;
}

async function getTypeGerman(fetch, type) {
  // Map English type to German
  const typeMap = {
    normal: 'Normal', fire: 'Feuer', water: 'Wasser', grass: 'Pflanze', electric: 'Elektro', ice: 'Eis', fighting: 'Kampf', poison: 'Gift', ground: 'Boden', flying: 'Flug', psychic: 'Psycho', bug: 'Käfer', rock: 'Gestein', ghost: 'Geist', dragon: 'Drache', dark: 'Unlicht', steel: 'Stahl', fairy: 'Fee'
  };
  if (typeMap[type]) return typeMap[type];
  const res = await fetch(`${POKEAPI_BASE}/type/${type}`);
  const data = await res.json();
  const deName = data.names.find(n => n.language.name === 'de');
  return deName ? deName.name : type;
}

async function main() {
  const fetch = (await import('node-fetch')).default;
  const allSpecies = await fetchAllPokemon(fetch);
  const pokedex = [];
  for (let i = 0; i < allSpecies.length; i++) {
    const species = allSpecies[i];
    const id = i + 1;
    const name = await fetchGermanName(fetch, species.url);
    // Get default variety for types
    const speciesRes = await fetch(species.url);
    const speciesData = await speciesRes.json();
    const defaultVariety = speciesData.varieties.find(v => v.is_default);
    if (!defaultVariety) continue;
    const types = await fetchTypes(fetch, defaultVariety.pokemon.url);
    const type_primary = await getTypeGerman(fetch, types[0]);
    const type_secondary = types[1] ? await getTypeGerman(fetch, types[1]) : null;
    pokedex.push({ id, name, type_primary, type_secondary });
    if ((id % 50) === 0) console.log(`Fetched ${id} Pokémon...`);
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pokedex, null, 2), 'utf8');
  console.log(`Wrote ${pokedex.length} Pokémon to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 