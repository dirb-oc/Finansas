import { BrowserRouter, Routes, Route } from "react-router-dom";
import CardDetaild from "../Views/CardDetaild";
import AccountDetaild from "../Views/AccountDetaild";
import Investments from "../Views/Investments";
import CDTDetaild from "../Views/CDTDetaild";
import AssetsDetaild from "../Views/AssetsDetaild";
import Dashboard from "../Views/Dashboard";

import Inversiones from "../Views/Inversiones"

function AppRouter() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/Oldinversiones" element={<Inversiones />} />
                <Route path="/inversiones" element={<Investments />} />
                <Route path="/CDT" element={<CDTDetaild />} />
                <Route path="/assets" element={<AssetsDetaild />} />     
                <Route path="/cuentas/:id" element={<AccountDetaild />} />
                <Route path="/tarjeta/:id" element={<CardDetaild />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;