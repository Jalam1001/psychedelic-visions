import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Kaleidoscope from './pages/Kaleidoscope';
import Amazonian from './pages/Amazonian';
import Fractal from './pages/Fractal';
import Sacred from './pages/Sacred';
import Islamic from './pages/Islamic';
import Lab from './pages/Lab';
import Meditation from './pages/Meditation';
import Journey from './pages/Journey';
import Mandala from './pages/Mandala';
import Learn from './pages/Learn';
import Patterns from './pages/Patterns';
import { SafetyGate } from './ui/SafetyGate';

export default function App() {
  return (
    <HashRouter>
      <SafetyGate />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/amazonian" element={<Amazonian />} />
        <Route path="/kaleidoscope" element={<Kaleidoscope />} />
        <Route path="/fractal" element={<Fractal />} />
        <Route path="/sacred" element={<Sacred />} />
        <Route path="/islamic" element={<Islamic />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/meditation" element={<Meditation />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/mandala" element={<Mandala />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
