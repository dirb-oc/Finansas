
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ShoppingCart, TrendingUp, Plus, } from "lucide-react";
import { formatMoney, formatExpiration } from "../../Services/utils";

export default function BrokerActivity({ operaciones = [], movimientos = [], onCreateOperacion, onCreateMovimiento, }) {
    const [vista, setVista] = useState("operaciones");

    const esOperacion = vista === "operaciones";
    const registros = esOperacion ? operaciones : movimientos;

    const handleCreate = () => {
        if (esOperacion) {
            onCreateOperacion?.();
        } else {
            onCreateMovimiento?.();
        }
    };

    return (
        <div className="broker-activity">
            <div className="broker-activity-header">
                <div className="broker-activity-title">
                    <h3>Actividad</h3>

                    <div className="broker-switch">
                        <button
                            className={esOperacion ? "active" : ""}
                            onClick={() => setVista("operaciones")}
                            aria-pressed={esOperacion}
                        >
                            Operaciones
                        </button>

                        <button
                            className={!esOperacion ? "active" : ""}
                            onClick={() => setVista("movimientos")}
                            aria-pressed={!esOperacion}
                        >
                            Movimientos
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    className="broker-add-button"
                    onClick={handleCreate}
                >
                    <Plus size={16} />
                    <span>
                        Agregar {esOperacion ? "operación" : "movimiento"}
                    </span>
                </button>
            </div>

            <div className="broker-records-scroll">
                <div className="broker-records">
                    {registros.length > 0 ? (
                        registros.map((item) =>
                            esOperacion ? (
                                <OperacionRecord
                                    key={item.id}
                                    item={item}
                                />
                            ) : (
                                <MovimientoRecord
                                    key={item.id}
                                    item={item}
                                />
                            )
                        )
                    ) : (
                        <div className="broker-records-empty">
                            No hay {esOperacion ? "operaciones" : "movimientos"} registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OperacionRecord({ item }) {
    const compra = item.tipo === "compra";

    return (
        <article className="broker-record">
            <div className={`broker-record-icon ${compra ? "compra" : "venta"}`}>
                {compra
                    ? <ShoppingCart size={18} />
                    : <TrendingUp size={18} />
                }
            </div>

            <div className="broker-record-info">
                <strong>
                    {item.ticker}

                    <span className={`record-tag ${compra ? "compra" : "venta"}`}>
                        {compra ? "Compra" : "Venta"}
                    </span>

                </strong>

                <small>
                    {formatExpiration(item.fecha)}
                    {" · "}
                    {formatMoney(item.precio_unitario, item.moneda)} / unidad
                    {" · "}
                    {item.cantidad} unidades
                </small>
            </div>

            <strong className="broker-record-amount">
                {formatMoney(item.total, item.moneda)}
            </strong>
        </article>
    );
}

function MovimientoRecord({ item }) {
    const entrada = item.tipo === "entrada";

    return (
        <article className="broker-record">
            <div className={`broker-record-icon ${entrada ? "entrada" : "salida"}`}>
                {entrada
                    ? <ArrowDownLeft size={18} />
                    : <ArrowUpRight size={18} />
                }
            </div>

            <div className="broker-record-info">
                <strong>
                    {entrada ? "Depósito" : "Retiro"}

                    <span className={`record-tag ${entrada ? "entrada" : "salida"}`}>
                        {entrada ? "Entrada" : "Salida"}
                    </span>
                </strong>

                <span>{item.descripcion}</span>

                <small>{formatExpiration(item.fecha)}</small>
            </div>

            <strong className={`broker-record-amount ${entrada ? "positivo" : "negativo"}`}>
                {entrada ? "+" : "-"}
                {formatMoney(item.monto, item.moneda)}
            </strong>
        </article>
    );
}
