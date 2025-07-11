import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Shared style for inputs and buttons to match Session.tsx
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

const blockStyle = {
  background: '#f7f7f7',
  border: '1px solid #ddd',
  borderRadius: 12,
  padding: '1.5rem',
  marginBottom: '2rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};

const Home: React.FC = () => {
  const [sessionName, setSessionName] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/sessions');
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, password: sessionPassword || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      navigate(`/session/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = async (sessionId: string) => {
    setJoinSessionId(sessionId);
    setJoinPassword('');
    setJoinError('');
    setLoading(true);
    try {
      // Fetch the session to check if it has a password
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      if (!data.password) {
        // No password set, join directly
        navigate(`/session/${sessionId}`);
      } else {
        // Password set, prompt for password
        setShowPasswordPrompt(true);
      }
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setLoading(true);
    try {
      // Try to fetch the session with the password
      const res = await fetch(`/api/sessions/${joinSessionId}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      if (data.password && data.password !== joinPassword) {
        setJoinError('Incorrect password');
        setLoading(false);
        return;
      }
      setShowPasswordPrompt(false);
      navigate(`/session/${joinSessionId}`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <div style={blockStyle}>
        <h2>Create Session</h2>
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Session Name"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            required
            style={{ ...inputLikeSelectStyle, width: '100%', marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="Password (optional)"
            value={sessionPassword}
            onChange={e => setSessionPassword(e.target.value)}
            style={{ ...inputLikeSelectStyle, width: '100%', marginBottom: 8 }}
          />
          <button type="submit" disabled={loading} style={{ ...inputLikeSelectStyle, width: '100%', cursor: 'pointer' }}>Create</button>
        </form>
      </div>
      <div style={blockStyle}>
        <h2>Join Session</h2>
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputLikeSelectStyle, marginBottom: 8, width: '100%' }}
        />
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {filteredSessions.map(session => (
            <li key={session.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{session.name}</span>
              <button
                style={{ ...inputLikeSelectStyle, height: 32, padding: '0 16px', fontSize: 15, marginLeft: 8, cursor: 'pointer', width: 'auto' }}
                onClick={() => handleJoinClick(session.id)}
              >
                Join
              </button>
            </li>
          ))}
        </ul>
        {showPasswordPrompt && (
          <form onSubmit={handlePasswordSubmit} style={{ marginTop: 16 }}>
            <input
              type="password"
              placeholder="Session Password"
              value={joinPassword}
              onChange={e => setJoinPassword(e.target.value)}
              required
              style={{ ...inputLikeSelectStyle, width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={loading} style={{ ...inputLikeSelectStyle, flex: 1, cursor: 'pointer' }}>Enter</button>
              <button type="button" onClick={() => setShowPasswordPrompt(false)} style={{ ...inputLikeSelectStyle, flex: 1, cursor: 'pointer', background: '#eee' }}>
                Cancel
              </button>
            </div>
            {joinError && <div style={{ color: 'red', marginTop: 8 }}>{joinError}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default Home; 