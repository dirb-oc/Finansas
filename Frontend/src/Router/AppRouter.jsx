import { BrowserRouter, Routes, Route } from "react-router-dom";
import CardDetaild from "../Views/CardDetaild";
import AccountDetaild from "../Views/AccountDetaild";
import Inversiones from "../Views/Inversiones"
import Investments from "../Views/Investments";
;
import Dashboard from "../Views/Dashboard";

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/Oldinversiones" element={<Inversiones />} />
                <Route path="/inversiones" element={<Investments />} />
                <Route path="/cuentas/:id" element={<AccountDetaild />} />
                <Route path="/tarjeta/:id" element={<CardDetaild />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;