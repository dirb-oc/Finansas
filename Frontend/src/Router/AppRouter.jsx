import { BrowserRouter, Routes, Route } from "react-router-dom";

import CuentaDetail from "../Views/CuentaDetaild";
import Inversiones from "../Views/Inversiones";
import Dashboard from "../Views/Dashboard";

function AppRouter() {
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

export default AppRouter;