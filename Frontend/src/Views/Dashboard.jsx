import { Wallet, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { getStats } from "../controllers/statsController";
import { useEffect, useState } from "react";

import ExpensesCategory from "../Components/Stats/ExpensesCategory";
import CashFlowChart from "../Components/Stats/CashFlowChart";
import BalanceChart from "../Components/Stats/BalanceChart";
import MoneyDistribution from "../Components/Stats/MoneyDistribution";
import CreditCards from "../Components/Stats/CreditCards";
import Accounts from "../Components/Stats/Accounts";
import LastTransactions from "../Components/Stats/LastTransactions";

import SummaryCards from "../Components/SummaryCards";
import formatCOP from "../Services/utils";


function SectionHeading({ title, subtitle }) {
    return (
        <div className="heading">
            <div>
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        getStats().then(setStats);
    }, []);

    if (!stats) return <p className="loading">Cargando...</p>;

    const cards = [
        {
            key: "disponible",
            title: "Disponible",
            icon: <Wallet size={20} />,
            value: formatCOP(stats.disponible),
        },
        {
            key: "invertido",
            title: "Invertido",
            icon: <PiggyBank size={20} />,
            value: formatCOP(stats.invertido),
        },
        {
            key: "deuda",
            title: "Deuda",
            icon: <CreditCard size={20} />,
            value: formatCOP(stats.deuda),
        },
        {
            key: stats.balance_mes >= 0 ? "income" : "expense",
            title: "Balance del mes",
            icon: <TrendingUp size={20} />,
            value: `${stats.balance_mes >= 0 ? "+" : "-"}${formatCOP(Math.abs(Number(stats.balance_mes) || 0))}`,
            negative: stats.balance_mes < 0,
        },
    ];

    const fechaActual = new Date();
    const mes = fechaActual.toLocaleString("es-CO", { month: "long" });
    const year = fechaActual.getFullYear();

    return (
        <div className="General">

            <h1 className="title">Mi Patrimonio</h1>
            <p className="subtitle">
                Resumen Financiero · {mes.charAt(0).toUpperCase() + mes.slice(1)} {year}
            </p>

            <div className="divisor" />

            <SummaryCards
                cards={cards}
                ariaLabel="Resumen financiero"
            />

            <SectionHeading
                title="Evolución de tu patrimonio"
                subtitle="Comportamiento de tu dinero durante los últimos seis meses."
            />

            <div className="Stats">
                <div className="stats-main">
                    <BalanceChart patrimonio={stats.patrimonio_6_meses} />
                </div>

                <div className="stats-side">
                    <MoneyDistribution
                        disponible={stats.disponible}
                        invertido={stats.invertido}
                    />
                </div>
            </div>

            {/* MOVIMIENTOS FINANCIEROS */}
            <SectionHeading
                title="Flujo de dinero"
                subtitle="Ingresos, gastos y distribución de tus movimientos."
            />

            <div className="Stats">
                <div className="stats-main">
                    <CashFlowChart data={stats.flujo_6_meses} />
                </div>

                <div className="stats-side">
                    <ExpensesCategory
                        gastos_categoria={stats.gastos_categoria}
                        ingreso_categoria={stats.ingreso_categoria}
                    />
                </div>
            </div>

            {/* CUENTAS Y ACTIVIDAD */}
            <SectionHeading
                title="Cuentas y actividad"
                subtitle="Tus cuentas, tarjetas de crédito y movimientos recientes."
            />

            <div className="Stats">
                <Accounts data={stats} />
                <CreditCards cards={stats.tarjetas} />
                <LastTransactions movimientos={stats.ultimos_movimientos} />
            </div>

        </div>
    );
}
