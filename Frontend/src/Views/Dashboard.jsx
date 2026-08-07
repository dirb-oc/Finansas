import { useEffect, useState } from "react";
import { getStats } from "../controllers/statsController";
import StatCard from "../Components/Stats/StatCard";
import BalanceChart from "../Components/BalanceChart";
import CashFlowChart from "../Components/CashFlowChart";
import Accounts from "../Components/Stats/Accounts"
import Investments from "../Components/Stats/Investments"
import ExpensesCategory from "../Components/Stats/ExpensesCategory"
import "../Components/Dashboard.css";

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => { getStats().then(setStats); }, []);

    if (!stats) return <p className="loading">Cargando...</p>;

    const cards = [
        { title: "Disponible", value: stats.disponible, type: "disponible" },
        { title: "Invertido", value: stats.invertido, type: "invertido" },
        { title: "Total", value: stats.total, type: "patrimonio" },
        { title: "Deuda", value: stats.deuda, type: "gastos" },
        { title: "Balance Mes", value: stats.balance_mes, type: stats.balance_mes >= 0 ? "ingresos" : "gastos" },
    ];

    return (
        <div className="General">
            <h1 className="title">Mi Patrimonio</h1>
            <p className="subtitle">Resumen financiero · Julio 2026</p>

            <div className="divisor"></div>

            <div className="cards">
                {cards.map((card, index) => (
                    <StatCard
                        key={index}
                        card={card}
                    />
                ))}
            </div>
            <div className="Stats">
                <div className="stats-main">
                    <BalanceChart data={stats.patrimonio_6_meses} />
                </div>

                <div className="stats-side">
                    <Investments inversiones={stats.inversiones} />
                </div>
            </div>

            <div className="Stats">
                <div className="stats-main">
                    <CashFlowChart data={stats.flujo_6_meses} />
                </div>

                <div className="stats-side">
                    <ExpensesCategory categorias={stats.gastos_categoria} />
                </div>
            </div>
            <div className="Stats">
                <Accounts data={stats} />
                <Accounts data={stats} />
            </div>
        </div>
    );
}