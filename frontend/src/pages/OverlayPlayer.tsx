import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Pokemon {
  id: number;
  species: string;
  pokedexId?: number;
  location?: string;
  status: string;
  nickname?: string;
}

const OverlayPlayer: React.FC = () => {
  const { sessionId, playerName } = useParams();
  const [team, setTeam] = useState<Pokemon[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      // Get all players in the session
      const sessionRes = await fetch(`/api/sessions/${sessionId}`);
      const sessionData = await sessionRes.json();
      const player = sessionData.players.find((p: any) => p.name.toLowerCase() === String(playerName).toLowerCase());
      if (!player) return setTeam([]);
      // Fetch team from new endpoint (ordered by link id)
      const teamRes = await fetch(`/api/players/${player.id}/team`);
      if (!teamRes.ok) return setTeam([]);
      const teamMons = await teamRes.json();
      setTeam(teamMons);
    };
    fetchTeam();
    const interval = setInterval(fetchTeam, 5000);
    return () => clearInterval(interval);
  }, [sessionId, playerName]);

  // Fill up to 6 slots
  const slots = Array.from({ length: 6 }, (_, i) => team[i] || null);

  return (
    <div style={{ display: 'flex', gap: 4, background: 'transparent', padding: 8 }}>
      {slots.map((p, i) =>
        p ? (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`/sprites/${p.pokedexId || 359}.png`}
              alt={p.species}
              style={{ width: 96, height: 96, background: 'rgba(0,0,0,0.7)', borderRadius: 8, border: '1.5px solid #bbb' }}
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).src = '/sprites/359.png'; }}
            />
            <div
              style={{
                color: 'white',
                fontSize: 16,
                marginTop: 2,
                textAlign: 'center',
                textShadow: '0 1px 4px #000',
                maxWidth: 96,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={p.nickname || p.species}
            >
              {p.nickname || p.species}
            </div>
          </div>
        ) : (
          <div
            key={i}
            style={{ width: 96, height: 96, background: 'black', borderRadius: 8, border: '1.5px solid #bbb' }}
          />
        )
      )}
    </div>
  );
};

export default OverlayPlayer; 