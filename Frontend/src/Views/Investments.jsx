import { getStatsInversiones } from "../controllers/investmentsController";
import { useEffect, useState } from "react";

import IncomeSummary from "../Components/Investments/IncomeSummary";
import GainsSection from "../Components/Investments/GainsSection";
import AssetsCard from "../Components/Investments/AssetsCard";
import CDTCard from "../Components/Investments/CDTCard";
import BackFooter from "../Components/BackFooter";


function Investments() {

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        async function cargarStats() {

            try {

                setLoading(true);

                const data = await getStatsInversiones();

                setStats(data);

            } catch (error) {

                console.error("Error cargando estadísticas:", error);
                setError("No se pudieron cargar las estadísticas.");

            } finally {

                setLoading(false);

            }
        }

        cargarStats();

    }, []);

    if (loading) {
        return (
            <div className="General">
                <p className="loading">Cargando estadísticas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="General">
                <p className="invest-error">{error}</p>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="General">

            <h1 className="title">Mis inversiones</h1>
            <p className="subtitle">Resumen general de tu patrimonio invertido</p>

            <div className="divisor" />

            {/* RESUMEN GENERAL */}
            <InvestmentSummary
                patrimonio={stats.patrimonio}
                cantidadInvertida={stats.cantidad_invertida}
                ganancia={stats.ganancia}
                rentabilidadTotal={stats.porcentajes.rentabilidad_total}
                gananciaSobrePatrimonio={stats.porcentajes.ganancia_sobre_patrimonio}
            />

            <div className="heading">
                <div>
                    <h2>Rendimiento del portafolio</h2>
                    <p>Ganancias realizadas y variaciones de tus inversiones.</p>
                </div>
            </div>

            {/* GANANCIAS */}
            <GainsSection
                ganancia={stats.ganancia}
                rentabilidadTotal={stats.porcentajes.rentabilidad_total}
                gananciaSobrePatrimonio={stats.porcentajes.ganancia_sobre_patrimonio}
            />


            <div className="heading">
                <div>
                    <h2>Mis posiciones</h2>
                    <p>Distribución de tus inversiones en renta variable y renta fija.</p>
                </div>
            </div>
            {/* ACTIVOS + CDT */}
            <div className="invest-duo">
                <AssetsCard activos={stats.activos} />
                <CDTCard cdts={stats.cdts} />
            </div>

            <div className="heading">
                <div>
                    <h2>Ingresos generados</h2>
                    <p>Dividendos y rendimientos obtenidos de las inversiones.</p>
                </div>
            </div>
            {/* DIVIDENDOS + RENDIMIENTOS DE CUENTAS */}
            <IncomeSummary
                dividendos={stats.dividendos}
                rendimientos={stats.rendimientos}
            />

            <BackFooter />

        </div>
    );
}

export default Investments;


import { Landmark, PiggyBank, TrendingUp, Percent } from "lucide-react";
import formatCOP, { formatPercentage, formatSigned } from "../Services/utils"
import SummaryCards from "../Components/SummaryCards";

function InvestmentSummary({ patrimonio, cantidadInvertida, ganancia, rentabilidadTotal, }) {
    const gananciaTotal = Number(ganancia?.total) || 0;

    const cards = [
        {
            key: "patrimonio",
            title: "Patrimonio",
            icon: <Landmark size={20} />,
            value: formatCOP(patrimonio),
        },
        {
            key: "invertido",
            title: "Invertido",
            icon: <PiggyBank size={20} />,
            value: formatCOP(cantidadInvertida),
        },
        {
            key: "ganancia",
            title: "Ganancia total",
            icon: <TrendingUp size={20} />,
            value: formatSigned(gananciaTotal),
            negative: gananciaTotal < 0,
        },
        {
            key: "rentabilidad",
            title: "Rentabilidad",
            icon: <Percent size={20} />,
            value: formatPercentage(rentabilidadTotal),
            negative: Number(rentabilidadTotal) < 0,
        },
    ];

    return (
        <SummaryCards
            cards={cards}
            ariaLabel="Resumen de inversiones"
        />
    );
}