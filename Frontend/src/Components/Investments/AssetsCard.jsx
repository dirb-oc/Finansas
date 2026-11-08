import { TrendingUp, TrendingDown, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

import formatCOP from "../../Services/utils";
import "./AssetsCard.css";

const formatSigned = (value) => {
    const number = Number(value) || 0;

    if (number === 0) return formatCOP(0);

    return `${number > 0 ? "+" : "-"}${formatCOP(Math.abs(number))}`;
};

export default function AssetsCard({ activos }) {
    const cantidad = Number(activos?.cantidad) || 0;
    const ganancia = Number(activos?.ganancia) || 0;
    const isPositive = ganancia >= 0;

    return (
        <Link to="/CDT/" className="assets-panel">
            <div className="assets-header">
                <div className="assets-title">
                    <LineChart size={20} />
                    <h3>Mis activos</h3>
                </div>

                <span>
                    {cantidad} {cantidad === 1 ? "activo" : "activos"}
                </span>
            </div>

            <div className="assets-capital">
                <div className="assets-capital__item">
                    <span>Capital invertido</span>
                    <strong>{formatCOP(activos?.capital_invertido)}</strong>
                </div>

                <div className="assets-capital__item">
                    <span>Valor actual</span>
                    <strong>{formatCOP(activos?.valor_actual)}</strong>
                </div>
            </div>

            <div className={`assets-performance ${isPositive ? "positive" : "negative"}`}>
                <div className="assets-performance__label">
                    {isPositive
                        ? <TrendingUp size={21} />
                        : <TrendingDown size={21} />
                    }
                    <span>Rendimiento</span>
                </div>

                <strong className={`${isPositive ? "increase" : "decrement"}`}>{formatSigned(ganancia)}</strong>
            </div>
        </Link>
    );
}