import { BrowserRouter, Routes, Route } from "react-router-dom";

import CuentaDetail from "./Views/CuentaDetaild";
import Inversiones from "./Views/Inversiones";
import Dashboard from "./Views/Dashboard";
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inversiones" element={<Inversiones />} />
                <Route path="/cuentas/:id" element={<CuentaDetail />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;