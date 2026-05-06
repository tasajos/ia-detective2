import { Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio.jsx';
import HumanoOIA from './pages/HumanoOIA.jsx';
import EntrenaIA from './pages/EntrenaIA.jsx';
import ChatIA from './pages/ChatIA.jsx';
import DilemaEtico from './pages/DilemaEtico.jsx';
import ProfesorPanel from './pages/ProfesorPanel.jsx';
import Layout from './components/Layout.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="humano-o-ia" element={<HumanoOIA />} />
        <Route path="entrena-ia" element={<EntrenaIA />} />
        <Route path="chat" element={<ChatIA />} />
        <Route path="dilema" element={<DilemaEtico />} />
        <Route path="profesor" element={<ProfesorPanel />} />
      </Route>
    </Routes>
  );
}
