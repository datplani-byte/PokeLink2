import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Select, { components as selectComponents } from 'react-select';

interface Pokemon {
  id: number;
  species: string;
  pokedexId?: number;
  nickname: string;
  level: number;
  status: string;
  location?: string;
}

interface Player {
  id: number;
  name: string;
  pokemon: Pokemon[];
}

interface SessionData {
  id: string;
  name: string;
  players: Player[];
  links: any[];
}

interface PokedexEntry {
  id: number;
  name: string;
  type_primary: string;
  type_secondary: string | null;
}

// Custom option for react-select with sprite
const SpeciesOption = (props: any) => (
  <selectComponents.Option {...props}>
    <img
      src={`/sprites/${props.data.id}.png`}
      alt={props.data.label}
      style={{ width: 32, height: 32, marginRight: 8, verticalAlign: 'middle' }}
      loading="lazy"
      onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
    />
    {props.data.label}
  </selectComponents.Option>
);
const SpeciesSingleValue = (props: any) => (
  <selectComponents.SingleValue {...props}>
    <img
      src={`/sprites/${props.data.id}.png`}
      alt={props.data.label}
      style={{ width: 32, height: 32, marginRight: 8, verticalAlign: 'middle' }}
      loading="lazy"
      onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
    />
    {props.data.label}
  </selectComponents.SingleValue>
);

// Define a shared style for inputs and buttons to match react-select dropdowns in size and appearance
const inputLikeSelectStyle = {
  height: 40,
  border: '1px solid #ccc',
  borderRadius: 4,
  padding: '0 12px',
  fontSize: 16,
  background: '#fff',
  minWidth: 0,
  boxSizing: 'border-box' as const,
};

// Shared style for section zones
const sectionZoneStyle = {
  background: '#f7f7f7',
  border: '1px solid #ddd',
  borderRadius: 12,
  padding: '1rem',
  marginBottom: '1rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};

const Session: React.FC = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [pokemonForms, setPokemonForms] = useState<{ [playerId: number]: any }>({});
  const [addingPokemon, setAddingPokemon] = useState<{ [playerId: number]: boolean }>({});
  const [speciesOptions, setSpeciesOptions] = useState<{ value: string; label: string; id: number }[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [speciesError, setSpeciesError] = useState('');
  const [editingPokemonId, setEditingPokemonId] = useState<number | null>(null);
  const [editingPokemonSpecies, setEditingPokemonSpecies] = useState<string | null>(null);
  const [copiedOverlayIndex, setCopiedOverlayIndex] = useState<number | null>(null);

  const fetchSession = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      setSession(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line
  }, [sessionId]);

  useEffect(() => {
    setSpeciesLoading(true);
    setSpeciesError('');
    fetch('/pokedex_de.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load Pokédex');
        return res.json();
      })
      .then((data: PokedexEntry[]) => {
        const options = data.map(entry => ({
          value: entry.name,
          label: entry.name,
          id: entry.id,
        }));
        setSpeciesOptions(options);
      })
      .catch(err => setSpeciesError(err.message))
      .finally(() => setSpeciesLoading(false));
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPlayer(true);
    setError('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName }),
      });
      if (!res.ok) throw new Error('Failed to add player');
      setNewPlayerName('');
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingPlayer(false);
    }
  };

  const handlePokemonFormChange = (playerId: number, field: string, value: any) => {
    setPokemonForms(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const handleAddPokemon = async (e: React.FormEvent, playerId: number) => {
    e.preventDefault();
    setAddingPokemon(prev => ({ ...prev, [playerId]: true }));
    setError('');
    try {
      const form = pokemonForms[playerId] || {};
      const selectedSpecies = speciesOptions.find(opt => opt.value === form.species);
      const pokedexId = selectedSpecies?.id || 359;
      const res = await fetch(`/api/players/${playerId}/pokemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: form.species,
          pokedexId,
          nickname: form.nickname,
          level: Number(form.level) || 50,
          status: form.status || 'alive',
          location: form.location || 'box',
        }),
      });
      if (!res.ok) throw new Error('Failed to add Pokémon');
      setPokemonForms(prev => ({ ...prev, [playerId]: {} }));
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingPokemon(prev => ({ ...prev, [playerId]: false }));
    }
  };

  // Helper to get unlinked Pokémon for each player
  const getUnlinkedPokemon = (player: Player, links: any[], isPlayer1: boolean) => {
    if (!player || !player.pokemon) return [];
    const linkedIds = links.map(l => isPlayer1 ? l.pokemonAId : l.pokemonBId);
    return player.pokemon.filter(p => !linkedIds.includes(p.id));
  };

  // State for linking
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [selectedA, setSelectedA] = useState<number | ''>('');
  const [selectedB, setSelectedB] = useState<number | ''>('');

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    setLinkError('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemonAId: selectedA, pokemonBId: selectedB }),
      });
      if (!res.ok) throw new Error('Failed to link Pokémon');
      setSelectedA('');
      setSelectedB('');
      await fetchSession();
    } catch (err: any) {
      setLinkError(err.message);
    } finally {
      setLinking(false);
    }
  };

  // Handler to update Pokémon status
  const handleStatusChange = async (pokemonId: number, newStatus: string, linkedPokemonId?: number) => {
    await fetch(`/api/pokemon/${pokemonId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    // If this Pokémon is set to dead and has a linked partner, set the partner to fainted
    if (newStatus === 'dead' && linkedPokemonId) {
      await fetch(`/api/pokemon/${linkedPokemonId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fainted' }),
      });
    }
    await fetchSession();
  };

  // Handler to update species and pokedexId
  const handleUpdateSpecies = async (pokemonId: number, newSpecies: string, newPokedexId: number) => {
    await fetch(`/api/pokemon/${pokemonId}/species`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ species: newSpecies, pokedexId: newPokedexId }),
    });
    setEditingPokemonId(null);
    setEditingPokemonSpecies(null);
    await fetchSession();
  };

  if (loading) return <div>Loading session...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!session) return <div>Session not found.</div>;

  return (
    <div style={{ marginTop: 25, paddingLeft: 25, paddingRight: 25, paddingBottom: 300 }}>
      <div style={sectionZoneStyle}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Session: {session.name}
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Are you sure you want to remove all Pokémon for both players in this session?')) {
                for (const player of session.players) {
                  await fetch(`/api/players/${player.id}/pokemon`, { method: 'DELETE' });
                }
                await fetchSession();
              }
            }}
            style={{ fontSize: 24, color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
            title="Reset session (remove all Pokémon for both players)"
          >
            ♻️ Reset Session
          </button>
        </h1>
        <p>Session ID: {session.id}</p>
      </div>
      <div style={sectionZoneStyle}>
        <h1>Players</h1>
        <div style={{ display: 'flex', gap: 24 }}>
          {session.players.map((player, idx) => {
            const teamCount = player.pokemon.filter(pk => pk.location === 'team').length;
            return (
              <div key={player.id} style={{ 
                width: '50%', 
                minWidth: 0, 
                borderRight: idx === 0 ? '1px solid #ccc' : 'none',
                paddingRight: idx === 0 ? 24 : 0
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><h3 style={{marginBottom: 5}}>{player.name}
                  <button
                    type="button"
                    onClick={async () => {
                      const overlayUrl = `${window.location.origin}/overlay/${session.id}/${encodeURIComponent(player.name)}`;
                      await navigator.clipboard.writeText(overlayUrl);
                      setCopiedOverlayIndex(session.players.indexOf(player));
                      setTimeout(() => setCopiedOverlayIndex(null), 1200);
                    }}
                    style={{ marginLeft: 8, fontSize: 16, textDecoration: 'none', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Copy overlay link to clipboard"
                  >
                    {copiedOverlayIndex === session.players.indexOf(player) ? '✅ Copied!' : '🔗 Overlay'}
                  </button>
                </h3></span>
                <div style={{ marginTop: 12 }}>
                  {player.pokemon && player.pokemon.length > 0 ? (
                    player.pokemon.map(p => (
                      <div key={p.id} style={{ 
                        background: p.status === 'dead' ? '#ffb3b3' : p.status === 'fainted' ? '#ffe0b3' : '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: 8,
                        paddingRight: 5,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}>
                        <img
                          src={`/sprites/${p.pokedexId || 359}.png`}
                          alt={p.species}
                          style={{ width: 40, height: 40, flexShrink: 0 }}
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editingPokemonId === p.id ? (
                            <Select
                              options={speciesOptions}
                              value={speciesOptions.find(opt => opt.value === editingPokemonSpecies) || null}
                              onChange={option => {
                                if (option) handleUpdateSpecies(p.id, option.value, option.id);
                              }}
                              placeholder="Select Pokémon species..."
                              isSearchable
                              components={{ Option: SpeciesOption, SingleValue: SpeciesSingleValue }}
                              styles={{ menu: base => ({ ...base, zIndex: 9999 }), container: base => ({ ...base, minWidth: 180 }) }}
                              autoFocus
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 500, fontSize: 16 }}>
                                {p.nickname ? `${p.nickname} (${p.species})` : p.species}
                              </span>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 14 }}
                                onClick={() => { setEditingPokemonId(p.id); setEditingPokemonSpecies(p.species); }}
                                title="Edit species"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </div>
                        <select
                          value={p.status}
                          onChange={e => {
                            // Find if this Pokémon is linked and get the partner's id
                            let linkedPartnerId: number | undefined = undefined;
                            session.links.forEach(link => {
                              if (link.pokemonAId === p.id) linkedPartnerId = link.pokemonBId;
                              if (link.pokemonBId === p.id) linkedPartnerId = link.pokemonAId;
                            });
                            handleStatusChange(p.id, e.target.value, linkedPartnerId);
                          }}
                          style={{ ...inputLikeSelectStyle, width: 100, height: 32, fontSize: 14 }}
                          disabled={p.status === 'dead' || p.status === 'fainted'}
                        >
                          <option value="alive">Alive</option>
                          <option value="fainted">Fainted</option>
                          <option value="dead">Dead</option>
                        </select>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#6c757d', fontStyle: 'italic' }}>
                      No Pokémon
                    </div>
                  )}
                </div>
                {/* Add Pokémon form */}
                <form onSubmit={e => handleAddPokemon(e, player.id)} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', maxWidth: '100%' }}>
                  {speciesLoading ? (
                    <div>Loading Pokémon...</div>
                  ) : speciesError ? (
                    <div style={{ color: 'red' }}>{speciesError}</div>
                  ) : (
                    <div style={{ minWidth: 220, flex: '1 1 220px' }}>
                      <Select
                        options={speciesOptions}
                        value={speciesOptions.find(opt => opt.value === pokemonForms[player.id]?.species) || null}
                        onChange={option => handlePokemonFormChange(player.id, 'species', option?.value)}
                        placeholder="Pokémon"
                        isSearchable
                        styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
                        required
                        components={{ Option: SpeciesOption, SingleValue: SpeciesSingleValue }}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Nickname"
                    value={pokemonForms[player.id]?.nickname || ''}
                    onChange={e => handlePokemonFormChange(player.id, 'nickname', e.target.value)}
                    style={{ ...inputLikeSelectStyle, flex: '1 1 120px' }}
                  />
                  {/* <input
                    type="number"
                    placeholder="Level"
                    value={pokemonForms[player.id]?.level || ''}
                    onChange={e => handlePokemonFormChange(player.id, 'level', e.target.value)}
                    min={1}
                    required
                    style={{ ...inputLikeSelectStyle, width: 70 }}
                  />  */}
                  <select
                    value={pokemonForms[player.id]?.status || 'alive'}
                    onChange={e => handlePokemonFormChange(player.id, 'status', e.target.value)}
                    style={{ ...inputLikeSelectStyle, width: 90 }}
                  >
                    <option value="alive">Alive</option>
                    <option value="fainted">Fainted</option>
                    <option value="dead">Dead</option>
                  </select>
                  <button type="submit" disabled={addingPokemon[player.id]} style={{ ...inputLikeSelectStyle, height: 40, cursor: 'pointer' }}>Add Pokémon</button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
      {session.players.length < 2 && (
        <div style={sectionZoneStyle}>
          <form onSubmit={handleAddPlayer} style={{ marginTop: 0 }}>
            <input
              type="text"
              placeholder="New player name"
              value={newPlayerName}
              style={{ ...inputLikeSelectStyle, flex: '1 1 120px' }}
              onChange={e => setNewPlayerName(e.target.value)}
              required
            />
            <button style={{ ...inputLikeSelectStyle, height: 40, cursor: 'pointer', marginLeft: 15 }} type="submit" disabled={addingPlayer}>Add Player</button>
          </form>
        </div>
      )}
      <div style={sectionZoneStyle}>
        <h1>Links</h1>
        {session.links.length === 0 ? (
          <div>No links yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ fontSize: 18, textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                  {session.players[0]?.name || 'Player 1'}
                </th>
                <th style={{ fontSize: 18, textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                  {session.players[1]?.name || 'Player 2'}
                </th>
                <th style={{ fontSize: 18, textAlign: 'left', borderBottom: '1px solid #ccc' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {session.links.map(link => {
                const playerA = session.players.find(p => p.pokemon.some(pk => pk.id === link.pokemonAId));
                const playerB = session.players.find(p => p.pokemon.some(pk => pk.id === link.pokemonBId));
                const displayA = (
                  <>
                    <img
                      src={`/sprites/${link.pokemonA?.pokedexId || 359}.png`}
                      alt={link.pokemonA?.species}
                      style={{ width: 32, height: 32, marginRight: 8, verticalAlign: 'middle' }}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
                    />
                    {link.pokemonA?.nickname ? `${link.pokemonA.nickname} (${link.pokemonA.species})` : link.pokemonA?.species || 'Pokémon'}
                  </>
                );
                const displayB = (
                  <>
                    <img
                      src={`/sprites/${link.pokemonB?.pokedexId || 359}.png`}
                      alt={link.pokemonB?.species}
                      style={{ width: 32, height: 32, marginRight: 8, verticalAlign: 'middle' }}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
                    />
                    {link.pokemonB?.nickname ? `${link.pokemonB.nickname} (${link.pokemonB.species})` : link.pokemonB?.species || 'Pokémon'}
                  </>
                );

                // Determine link status
                let linkStatus = 'alive';
                if (link.pokemonA?.status === 'dead' || link.pokemonB?.status === 'dead') linkStatus = 'dead';
                else if (link.pokemonA?.status === 'fainted' || link.pokemonB?.status === 'fainted') linkStatus = 'fainted';

                // Handler to update both locations
                const handleBothLocationChange = async (newLocation: string) => {
                  await Promise.all([
                    fetch(`/api/pokemon/${link.pokemonA.id}/location`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ location: newLocation }),
                    }),
                    fetch(`/api/pokemon/${link.pokemonB.id}/location`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ location: newLocation }),
                    })
                  ]);
                  await fetchSession();
                };

                const teamCountA = session.players.find(p => p.pokemon.some(pk => pk.id === link.pokemonAId))?.pokemon.filter(pk => pk.location === 'team').length || 0;
                const teamCountB = session.players.find(p => p.pokemon.some(pk => pk.id === link.pokemonBId))?.pokemon.filter(pk => pk.location === 'team').length || 0;
                const teamLimitReached = teamCountA >= 6 || teamCountB >= 6;
                const currentLocation = link.pokemonA?.location || link.pokemonB?.location || 'team';

                // Row style for status
                const rowStyle = linkStatus === 'alive' ? {} : { background: 'rgba(255, 0, 0, 0.12)' };

                return (
                  <tr key={link.id} style={rowStyle}>
                    <td style={{ padding: 4, borderBottom: '1px solid #eee' }}>
                      <div>{displayA}</div>
                    </td>
                    <td style={{ padding: 4, borderBottom: '1px solid #eee' }}>
                      <div>{displayB}</div>
                    </td>
                    <td style={{ padding: 4, borderBottom: '1px solid #eee' }}>
                      <select
                        value={currentLocation}
                        onChange={e => handleBothLocationChange(e.target.value)}
                        style={{ ...inputLikeSelectStyle, width: 110 }}
                      >
                        <option value="box">box</option>
                        <option value="team" disabled={teamLimitReached && currentLocation !== 'team'}>team</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {session.players.length === 2 && (
        <div style={sectionZoneStyle}>
          <form onSubmit={handleLink} style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', width: 800 }}>
            <Select
              options={getUnlinkedPokemon(session.players[0], session.links, true).map(p => {
                const opt = speciesOptions.find(opt => opt.value === p.species);
                return {
                  value: p.id,
                  label: p.nickname ? `${p.nickname} (${p.species})` : p.species,
                  id: p.pokedexId || opt?.id || 359,
                  species: p.species,
                };
              })}
              value={(() => {
                const p = session.players[0].pokemon.find(pk => pk.id === selectedA);
                if (!p) return null;
                const opt = speciesOptions.find(opt => opt.value === p.species);
                return {
                  value: p.id,
                  label: p.nickname ? `${p.nickname} (${p.species})` : p.species,
                  id: p.pokedexId || opt?.id || 359,
                  species: p.species,
                };
              })()}
              onChange={option => setSelectedA(option?.value || '')}
              placeholder="Player 1 Pokémon"
              isSearchable
              components={{ Option: SpeciesOption, SingleValue: SpeciesSingleValue }}
              styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
            />
            <Select
              options={getUnlinkedPokemon(session.players[1], session.links, false).map(p => {
                const opt = speciesOptions.find(opt => opt.value === p.species);
                return {
                  value: p.id,
                  label: p.nickname ? `${p.nickname} (${p.species})` : p.species,
                  id: p.pokedexId || opt?.id || 359,
                  species: p.species,
                };
              })}
              value={(() => {
                const p = session.players[1].pokemon.find(pk => pk.id === selectedB);
                if (!p) return null;
                const opt = speciesOptions.find(opt => opt.value === p.species);
                return {
                  value: p.id,
                  label: p.nickname ? `${p.nickname} (${p.species})` : p.species,
                  id: p.pokedexId || opt?.id || 359,
                  species: p.species,
                };
              })()}
              onChange={option => setSelectedB(option?.value || '')}
              placeholder="Player 2 Pokémon"
              isSearchable
              components={{ Option: SpeciesOption, SingleValue: SpeciesSingleValue }}
              styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
            />
            <button type="submit" disabled={linking} style={{ ...inputLikeSelectStyle, height: 40, cursor: 'pointer' }}>Link</button>
            {linkError && <div style={{ color: 'red' }}>{linkError}</div>}
          </form>
        </div>
      )}
    </div>
  );
};

export default Session; 