import { Wallet,TrendingUp,Gem,ArrowUpCircle,ArrowDownCircle,BarChart3 } from "lucide-react";
import formatCOP from "../../Services/utils";
import "./StatCard.css";

const iconMap = {
    disponible: Wallet,
    invertido: TrendingUp,
    total: Gem,
    ingresos: ArrowUpCircle,
    gastos: ArrowDownCircle,
};

export default function StatCard({ card }) {
    const Icon = iconMap[card.type] || BarChart3;

    return (
        <div className={`card ${card.type}`}>
            <div className="card-header">
                <span className="card-icon">
                    <Icon size={18} strokeWidth={2} />
                </span>
                <span className="card-title">{card.title}</span>
            </div>

            <p className="card-value">{formatCOP(card.value)}</p>

            <div className={`card-accent ${card.type}`} />
        </div>
    );
}