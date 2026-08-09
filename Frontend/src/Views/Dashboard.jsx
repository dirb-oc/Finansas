import { useEffect, useState } from "react";
import { getStats } from "../controllers/statsController";
import ExpensesCategory from "../Components/Stats/ExpensesCategory"
import CashFlowChart from "../Components/Stats/CashFlowChart";
import BalanceChart from "../Components/Stats/BalanceChart";
import Investments from "../Components/Stats/Investments"
import CreditCards from "../Components/Stats/CreditCards"
import StatCard from "../Components/Stats/StatCard";
import Accounts from "../Components/Stats/Accounts";
import LastTransactions from "../Components/Stats/LastTransactions";

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
            <p className="subtitle">Resumen financiero · Agosto 2026</p>

            <div className="divisor" />

            <div className="cards">
                {cards.map((card, index) => ( <StatCard key={index} card={card} /> ))}
            </div>

            <div className="Stats">

                <div className="stats-main">
                    <BalanceChart patrimonio={stats.patrimonio_6_meses} />
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
                <CreditCards cards={stats.tarjetas} />
                <LastTransactions movimientos={stats.ultimos_movimientos} />

            </div>
        </div>
    );
}