
import { Landmark, ArrowDownLeft, ArrowUpRight, ShoppingCart, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";

import formatCOP, { formatMoney, formatExpiration, } from "../../Services/utils";

import "./BrokerSection.css";

export default function BrokerSection({ brokers = [], historial = {} }) {
    const [vista, setVista] = useState("operaciones");

    const broker = brokers[0];

    if (!broker) return null;

    const movimientos = (historial.movimientos || []).filter(
        (item) => item.broker_id === broker.broker_id
    );

    const operaciones = (historial.operaciones || []).filter(
        (item) => item.broker_id === broker.broker_id
    );

    const registros = vista === "operaciones" ? operaciones : movimientos;

    return (
        <>
            <div className="heading">
                <div>
                    <h2>Broker</h2>
                    <p>Posiciones actuales de tu portafolio</p>
                </div>
            </div>

            <section className="broker-section">
                <div className="broker-panel">

                    {/* COLUMNA IZQUIERDA: BROKER */}
                    <aside className="broker-summary">

                        <div className="broker-summary-header">
                            <div className="broker-avatar">
                                <Landmark size={23} />
                            </div>

                            <div>
                                <h3>{broker.broker}</h3>
                                <span>
                                    Cuenta de inversión · {broker.moneda}
                                </span>
                            </div>
                            
                            <button>Cotizacion</button>
                        </div>

                        <div className="broker-stats">
                            <div className="broker-stat">
                                <span>Patrimonio total</span>
                                <strong>
                                    {formatMoney(broker.patrimonio, broker.moneda)}
                                </strong>
                            </div>

                            <div className="broker-stat">
                                <span>Saldo disponible</span>
                                <strong>
                                    {formatMoney(broker.saldo_disponible, broker.moneda)}
                                </strong>
                            </div>

                            <div className="broker-stat">
                                <span>Valor invertido</span>
                                <strong>
                                    {formatMoney(broker.valor_invertido, broker.moneda)}
                                </strong>
                            </div>

                            <div className="broker-stat">
                                <span>Cotización dólar</span>
                                <strong>{formatCOP(broker.tasa_cop)}</strong>
                            </div>
                        </div>

                        <div className="broker-cop">
                            <span>Patrimonio en COP</span>
                            <strong>{formatCOP(broker.patrimonio_cop)}</strong>
                        </div>

                    </aside>

                    {/* COLUMNA DERECHA: HISTORIAL */}
                    <div className="broker-activity">

                        <div className="broker-activity-header">
                            <div className="broker-activity-title">
                                <h3>Actividad</h3>

                                <div className="broker-switch">
                                    <button
                                        className={vista === "operaciones" ? "active" : ""}
                                        onClick={() => setVista("operaciones")}
                                        aria-pressed={vista === "operaciones"}
                                    >
                                        Operaciones
                                    </button>

                                    <button
                                        className={vista === "movimientos" ? "active" : ""}
                                        onClick={() => setVista("movimientos")}
                                        aria-pressed={vista === "movimientos"}
                                    >
                                        Movimientos
                                    </button>
                                </div>
                            </div>

                            <button
                                className="broker-add-button"
                                onClick={() => {
                                    if (vista === "operaciones") {
                                        // Abrir formulario de operación
                                        openCreateOperacion();
                                    } else {
                                        // Abrir formulario de movimiento
                                        openCreateMovimiento();
                                    }
                                }}
                            >
                                <Plus size={16} />
                                <span>
                                    {vista === "operaciones"
                                        ? "Agregar operación"
                                        : "Agregar movimiento"}
                                </span>
                            </button>
                        </div>

                        {/* CONTENEDOR CON SCROLL */}
                        <div className="broker-records-scroll">
                            <div className="broker-records">

                                {registros.length > 0 ? (
                                    registros.map((item) => {
                                        if (vista === "operaciones") {
                                            const compra = item.tipo === "compra";

                                            return (
                                                <article className="broker-record" key={item.id} >
                                                    <div className={`broker-record-icon ${compra ? "compra" : "venta"}`} >
                                                        {compra
                                                            ? <ShoppingCart size={18} />
                                                            : <TrendingUp size={18} />
                                                        }
                                                    </div>

                                                    <div className="broker-record-info">
                                                        <strong>
                                                            {item.ticker}

                                                            <span className={`record-tag ${compra ? "compra" : "venta"}`} >
                                                                {compra ? "Compra" : "Venta"}
                                                            </span>

                                                            {item.nombre}

                                                        </strong>


                                                        <small>
                                                            {formatExpiration(item.fecha)}
                                                            {" · "}
                                                            {formatMoney(item.precio_unitario, item.moneda)} / unidad
                                                            {" · "}
                                                            <span>{item.cantidad} unidades</span>

                                                        </small>
                                                    </div>

                                                    <strong className="broker-record-amount">
                                                        {formatMoney(item.total, item.moneda)}
                                                    </strong>
                                                </article>
                                            );
                                        }

                                        const entrada = item.tipo === "entrada";

                                        return (
                                            <article className="broker-record" key={item.id} >
                                                <div className={`broker-record-icon ${entrada ? "entrada" : "salida"}`} >
                                                    {entrada
                                                        ? <ArrowDownLeft size={18} />
                                                        : <ArrowUpRight size={18} />
                                                    }
                                                </div>

                                                <div className="broker-record-info">
                                                    <strong>
                                                        {entrada ? "Depósito" : "Retiro"}

                                                        <span className={`record-tag ${entrada ? "entrada" : "salida"}`} >
                                                            {entrada ? "Entrada" : "Salida"}
                                                        </span>
                                                    </strong>

                                                    <span>{item.descripcion}</span>

                                                    <small>
                                                        {formatExpiration(item.fecha)}
                                                    </small>
                                                </div>

                                                <strong
                                                    className={`broker-record-amount ${entrada ? "positivo" : "negativo"}`}
                                                >
                                                    {entrada ? "+" : "-"}
                                                    {formatMoney(item.monto, item.moneda)}
                                                </strong>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="broker-records-empty">
                                        No hay {vista === "operaciones" ? "operaciones" : "movimientos"} registrados.
                                    </div>
                                )}
                                

                            </div>
                        </div>

                    </div>
                </div>
            </section>

        </>
    );
}
