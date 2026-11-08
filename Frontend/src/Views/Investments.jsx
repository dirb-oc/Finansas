import { getStatsInversiones } from "../controllers/investmentsController";
import { useEffect, useState } from "react";

import InvestmentSummary from "../Components/Investments/InvestmentSummary";
import IncomeSummary from "../Components/Investments/IncomeSummary";
import GainsSection from "../Components/Investments/GainsSection";
import AssetsCard from "../Components/Investments/AssetsCard";
import CDTCard from "../Components/Investments/CDTCard";

import "./Investments.css";

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
            <div className="General invest-view">
                <p className="loading">Cargando estadísticas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="General invest-view">
                <p className="invest-error">{error}</p>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="General invest-view">

            <header className="invest-header">
                <h1 className="title">Mis inversiones</h1>
                <p className="subtitle">Resumen general de tu patrimonio invertido</p>
            </header>

            <div className="divisor" />

            {/* RESUMEN GENERAL */}
            <InvestmentSummary
                patrimonio={stats.patrimonio}
                cantidadInvertida={stats.cantidad_invertida}
                ganancia={stats.ganancia}
                rentabilidadTotal={stats.porcentajes.rentabilidad_total}
                gananciaSobrePatrimonio={stats.porcentajes.ganancia_sobre_patrimonio}
            />

            {/* GANANCIAS */}
            <GainsSection
                ganancia={stats.ganancia}
                rentabilidadTotal={stats.porcentajes.rentabilidad_total}
                gananciaSobrePatrimonio={stats.porcentajes.ganancia_sobre_patrimonio}
            />

            {/* ACTIVOS + CDT */}
            <div className="invest-duo">
                <AssetsCard activos={stats.activos} />
                <CDTCard cdts={stats.cdts} />
            </div>

            {/* DIVIDENDOS + RENDIMIENTOS DE CUENTAS */}
            <IncomeSummary
                dividendos={stats.dividendos}
                rendimientos={stats.rendimientos}
            />

        </div>
    );
}

export default Investments;