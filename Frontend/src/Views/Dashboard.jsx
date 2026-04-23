import { useEffect, useState } from "react";
import { getStats } from "../controllers/statsController";
import StatCard from "../Components/StatCard";
import BalanceChart from "../Components/BalanceChart";
import "../Components/Dashboard.css";
import CashFlowChart from "../Components/CashFlowChart";

export default function Dashboard() {

    const [stats, setStats] = useState(null);

    useEffect(() => { getStats().then(setStats); }, []);

    if (!stats) return <p className="loading">Cargando...</p>;

    const cards = [
        { title: "Disponible", value: stats.disponible, type: "disponible" },
        { title: "Invertido", value: stats.invertido, type: "invertido" },
        { title: "Total", value: stats.total, type: "total" },
        { title: "Balance Mes", value: stats.balance_mes, type: "ingresos" },
    ];

    return (
        <div className="General">
            <h1 className="dashboard-title">Resumen Financiero</h1>

            <div className="cards">
                {cards.map((card, index) => (
                    <StatCard
                        key={index}
                        title={card.title}
                        value={card.value}
                        type={card.type}
                    />
                ))}
            </div>
            <BalanceChart data={stats.patrimonio_6_meses} />
            <CashFlowChart data={stats.flujo_6_meses} />;

        </div>
    );
}