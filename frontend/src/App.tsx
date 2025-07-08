import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import Home from './pages/Home';
import Session from './pages/Session';
import OverlayPlayer from './pages/OverlayPlayer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/overlay/:sessionId/:playerName" element={<OverlayPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;
