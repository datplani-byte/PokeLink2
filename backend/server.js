const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logging middleware for all API requests
app.use('/api', (req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Sessions ---
// List all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        players: { include: { pokemon: true } },
        links: true,
      },
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { name, password } = req.body;
    const session = await prisma.session.create({
      data: { name, password },
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session by ID
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        players: { include: { pokemon: true } },
        links: {include: {pokemonA: true, pokemonB: true}},
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Players ---
// List players in a session
app.get('/api/sessions/:sessionId/players', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      where: { sessionId: req.params.sessionId },
      include: { pokemon: true },
    });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add player to session
app.post('/api/sessions/:sessionId/players', async (req, res) => {
  try {
    const { name } = req.body;
    const player = await prisma.player.create({
      data: {
        name,
        session: { connect: { id: req.params.sessionId } },
      },
    });
    res.status(201).json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { pokemon: true, session: true },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Pokémon ---
// List Pokémon for a player
app.get('/api/players/:playerId/pokemon', async (req, res) => {
  try {
    const pokemon = await prisma.pokemon.findMany({
      where: { playerId: parseInt(req.params.playerId) },
      include: { linksA: true, linksB: true },
    });
    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Pokémon to player
app.post('/api/players/:playerId/pokemon', async (req, res) => {
  try {
    const { species, pokedexId, nickname, level, status, location } = req.body;
    const pokemon = await prisma.pokemon.create({
      data: {
        species,
        pokedexId,
        nickname,
        level,
        status,
        location,
        player: { connect: { id: parseInt(req.params.playerId) } },
      },
    });
    res.status(201).json(pokemon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset all Pokémon for a player
app.delete('/api/players/:playerId/pokemon', async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    // Find all Pokémon IDs for this player
    const pokemons = await prisma.pokemon.findMany({
      where: { playerId },
      select: { id: true }
    });
    const pokemonIds = pokemons.map(p => p.id);

    // Delete all links where either side is one of these Pokémon
    await prisma.link.deleteMany({
      where: {
        OR: [
          { pokemonAId: { in: pokemonIds } },
          { pokemonBId: { in: pokemonIds } }
        ]
      }
    });

    // Now delete the Pokémon
    await prisma.pokemon.deleteMany({
      where: { playerId }
    });

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Pokémon by ID
app.get('/api/pokemon/:id', async (req, res) => {
  try {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { player: true, linksA: true, linksB: true },
    });
    if (!pokemon) return res.status(404).json({ error: 'Pokémon not found' });
    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Pokémon status
app.patch('/api/pokemon/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const pokemon = await prisma.pokemon.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(pokemon);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Pokémon not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update Pokémon location
app.patch('/api/pokemon/:id/location', async (req, res) => {
  try {
    const { location } = req.body;
    const pokemon = await prisma.pokemon.update({
      where: { id: parseInt(req.params.id) },
      data: { location },
    });
    res.json(pokemon);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Pokémon not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update Pokémon species and pokedexId
app.patch('/api/pokemon/:id/species', async (req, res) => {
  try {
    const { species, pokedexId } = req.body;
    const pokemon = await prisma.pokemon.update({
      where: { id: parseInt(req.params.id) },
      data: { species, pokedexId },
    });
    res.json(pokemon);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Pokémon not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get all Pokémon
app.get('/api/pokemon', async (req, res) => {
  try {
    const pokemon = await prisma.pokemon.findMany({
      include: { player: true, linksA: true, linksB: true },
    });
    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List team Pokémon for a player, ordered by link id
app.get('/api/players/:playerId/team', async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    // Fetch Pokémon in team with their links (as A or B)
    const pokemon = await prisma.pokemon.findMany({
      where: {
        playerId,
        location: 'team',
      },
      include: {
        linksA: true,
        linksB: true,
      },
    });

    // For each Pokémon, get their link id (should only have one link)
    const pokemonWithLinkId = pokemon.map(p => {
      // Each Pokémon should only have one link (either as A or B)
      const link = (p.linksA[0] || p.linksB[0]) || null;
      return { ...p, linkId: link ? link.id : null };
    });

    // Order by linkId ascending (all should have a link, but just in case)
    pokemonWithLinkId.sort((a, b) => {
      if (a.linkId === null && b.linkId === null) return 0;
      if (a.linkId === null) return 1;
      if (b.linkId === null) return -1;
      return a.linkId - b.linkId;
    });

    res.json(pokemonWithLinkId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Links ---
// List links in a session
app.get('/api/sessions/:sessionId/links', async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { sessionId: req.params.sessionId },
      include: { pokemonA: true, pokemonB: true },
    });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new link
app.post('/api/sessions/:sessionId/links', async (req, res) => {
  try {
    const { pokemonAId, pokemonBId } = req.body;
    const link = await prisma.link.create({
      data: {
        session: { connect: { id: req.params.sessionId } },
        pokemonA: { connect: { id: pokemonAId } },
        pokemonB: { connect: { id: pokemonBId } },
      },
      include: { pokemonA: true, pokemonB: true },
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get link by ID
app.get('/api/links/:id', async (req, res) => {
  try {
    const link = await prisma.link.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { session: true, pokemonA: true, pokemonB: true },
    });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json(link);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 