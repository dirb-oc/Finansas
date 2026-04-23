import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/">Dashboard</Link>
            <Link to="/cuentas">Cuentas</Link>
            <Link to="/inversiones">Inversiones</Link>
        </nav>
    );
}