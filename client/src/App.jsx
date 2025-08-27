import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Success from './component/success';
import Home from './component/home';
import Cancel from './component/cencel';


function App() {
  return (
   <Outlet />
  );
}

export default App;
