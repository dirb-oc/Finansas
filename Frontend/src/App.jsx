import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";

import CuentaDetail from "./Views/CuentaDetaild";
import Inversiones from "./Views/Inversiones";
import Dashboard from "./Views/Dashboard";
import Cuentas from "./Views/Cuentas";

import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cuentas" element={<Cuentas />} />
                <Route path="/inversiones" element={<Inversiones />} />
                <Route path="/cuentas/:id" element={<CuentaDetail />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;