import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Record from './pages/Record';
import Upload from './pages/Upload';
import Analyze from './pages/Analyze';
import FAQ from './pages/FAQ';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/record" element={<Record />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
