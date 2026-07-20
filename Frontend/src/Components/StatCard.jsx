// src/Components/StatCard.jsx
import formatCOP from "../Services/utils";
import { Wallet,TrendingUp,Gem,ArrowUpCircle,ArrowDownCircle,BarChart3 } from "lucide-react";

const iconMap = {
    disponible: Wallet,
    invertido: TrendingUp,
    total: Gem,
    ingresos: ArrowUpCircle,
    gastos: ArrowDownCircle,
};

export default function StatCard({ title, value, type }) {
    const Icon = iconMap[type] || BarChart3;

    return (
        <div className={`card ${type}`}>
            <div className="card-header">
                <span className="card-icon">
                    <Icon size={18} strokeWidth={2} />
                </span>
                <span className="card-title">{title}</span>
            </div>

            <p className="card-value">{formatCOP(value)}</p>

            <div className={`card-accent ${type}`} />
        </div>
    );
}