import { useEffect, useState } from "react";
import { TrendingUp, Wallet, CircleDollarSign, ArrowUpRight, ArrowDownRight, PiggyBank, ChartNoAxesCombined } from "lucide-react";
import { Landmark, Percent } from "lucide-react";
import formatCOP from "../Services/utils";


import { getStatsInversiones } from "../controllers/investmentsController";
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


    const formatNumber = (value) => {

        return new Intl.NumberFormat("es-CO", {
            maximumFractionDigits: 2
        }).format(value ?? 0);

    };


    const formatPercent = (value) => {

        return `${formatNumber(value)}%`;

    };


    const formatDate = (date) => {

        return new Intl.DateTimeFormat("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date(date));

    };


    if (loading) {
        return (
            <div className="stats-loading">
                Cargando estadísticas...
            </div>
        );
    }


    if (error) {
        return (
            <div className="stats-error">
                {error}
            </div>
        );
    }


    if (!stats) {
        return null;
    }

    const cards = [
        { title: "patrimonio", icon: <Landmark size={18} />, value: formatCOP(stats.patrimonio) },
        { title: "invertido", icon: <PiggyBank size={18} />, value: formatCOP(stats.cantidad_invertida) },
        { title: "ganancia", icon: <TrendingUp size={18} />, value: formatCOP(stats.ganancia.realizada) },
        { title: "rentabilidad", icon: <Percent size={18} />, value: formatPercent(stats.porcentajes.ganancia_sobre_patrimonio) },
    ];



    return (

        <section className="General">

            {/* =========================
                RESUMEN
            ========================== */}

            <div className="stats-header">

                <div>
                    <h2>Mis inversiones</h2>
                    <p>Resumen general de tu patrimonio invertido</p>
                </div>

            </div>

            <div className="inv-cards">
                {
                    cards.map((card, index) => (
                        <div className={`inv-card ${card.title}`}>
                            <div className="inv-card-header">
                                <div className="inv-card-icon">
                                    {card.icon}
                                </div>
                                <span className="inv-card-label">{card.title}</span>
                            </div>
                            <span className="inv-card-value">
                                {card.value}
                            </span>
                            <div className="inv-card-accent" />
                        </div>
                    ))
                }
            </div>


            {/* =========================
                ACTIVOS
            ========================== */}

            <div className="stats-section">

                <div className="section-title">

                    <div>
                        <h3>Activos</h3>
                        <span>
                            {stats.activos.length} activo
                            {stats.activos.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                </div>


                <div className="assets-list">

                    {stats.activos.length === 0 ? (

                        <p className="empty">
                            No tienes activos registrados.
                        </p>

                    ) : (

                        stats.activos.map((activo) => (

                            <div
                                className="asset-card"
                                key={activo.id}
                            >

                                <div className="asset-main">

                                    <div className="asset-ticker">
                                        {activo.ticker}
                                    </div>

                                    <div>

                                        <strong>
                                            {activo.nombre}
                                        </strong>

                                        <span>
                                            {activo.tipo.toUpperCase()} · {activo.moneda}
                                        </span>

                                    </div>

                                </div>


                                <div className="asset-values">

                                    <div>
                                        <span>Cantidad</span>
                                        <strong>
                                            {formatNumber(activo.cantidad)}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>Precio actual</span>
                                        <strong>
                                            {formatCOP(activo.precio_actual)}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>Invertido</span>
                                        <strong>
                                            {formatCOP(activo.capital_invertido)}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>Valor actual</span>
                                        <strong>
                                            {formatCOP(activo.valor_actual)}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>


            {/* =========================
                DIVIDENDOS
            ========================== */}

            <div className="stats-section">

                <h3>Dividendos</h3>

                <div className="dividends-list">

                    {stats.dividendos.length === 0 ? (

                        <p className="empty">
                            No hay dividendos registrados.
                        </p>

                    ) : (

                        stats.dividendos.map((dividendo) => (

                            <div
                                className="dividend-row"
                                key={dividendo.id}
                            >

                                <div>

                                    <strong>
                                        {dividendo.ticker}
                                    </strong>

                                    <span>
                                        {dividendo.nombre}
                                    </span>

                                </div>


                                <div className="dividend-info">

                                    <span>
                                        {formatDate(dividendo.fecha)}
                                    </span>

                                    <strong className="positive">
                                        +{formatCOP(dividendo.monto)}
                                    </strong>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>


            {/* =========================
                RENDIMIENTOS
            ========================== */}

            <div className="stats-section">

                <h3>Rendimientos</h3>

                <div className="returns-list">

                    {stats.rendimientos.length === 0 ? (

                        <p className="empty">
                            No hay rendimientos registrados.
                        </p>

                    ) : (

                        stats.rendimientos.map((rendimiento) => (

                            <div
                                className="return-row"
                                key={rendimiento.id}
                            >

                                <div>

                                    <strong>
                                        {rendimiento.cuenta}
                                    </strong>

                                    <span>
                                        {formatDate(rendimiento.fecha)}
                                    </span>

                                </div>


                                <div className="return-values">

                                    <strong className="positive">
                                        +{formatCOP(rendimiento.monto)}
                                    </strong>

                                    <span>
                                        Saldo:{" "}
                                        {formatCOP(
                                            rendimiento.saldo_cuenta
                                        )}
                                    </span>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </section>

    );
}


export default Investments;