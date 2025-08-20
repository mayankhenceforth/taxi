import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Success from './component/success';
import Home from './component/home';
import Cancel from './component/cencel';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/payment-success" element={<Success />} />
        <Route path="/payment-cancel" element={<Cancel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
