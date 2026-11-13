import { formatMoney, formatExpiration } from "../../Services/utils";

import "./Activos.css";


export default function Activos({ activos = [], onCreate }) {
    return (
        <section className="activos-section">
            <div className="heading">
                <div>
                    <h2>Activos del portafolio</h2>
                    <p>Posiciones actuales de tu portafolio</p>
                </div>
                <span>{activos.length} activos</span>
            </div>

            <div className="activos-grid">
                {activos.map((activo) => (
                    <Activo
                        key={`${activo.broker_id}-${activo.activo_id}`}
                        activo={activo}
                        onCreate={onCreate}
                    />
                ))}
            </div>
        </section>
    );
}

function Activo({ activo = [], onCreate}) {
    const moneda = activo.moneda || "USD";

    const ganancia =
        Number(activo.ganancia_realizada ?? 0) +
        Number(activo.ganancia_no_realizada ?? 0);

    const rendimiento = Number(activo.rendimiento ?? 0);
    const positivo = ganancia >= 0;

    return (
        <article key={activo.id}
                    className="activo-card"
                    onClick={() => onCreate?.(activo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCreate?.(activo);
                        }
                    }} >
            {/* FILA 1: IDENTIFICACIÓN */}
            <div className="activo-header">
                <div className="activo-avatar">
                    {activo.ticker?.charAt(0) || "?"}
                </div>

                <div className="activo-identidad">
                    <div className="activo-titulo">
                        <h3>{activo.ticker}</h3>
                        <span className="activo-tipo">
                            {activo.tipo?.toUpperCase()}
                        </span>
                    </div>

                    <p>{activo.nombre} · {activo.broker}</p>

                </div>

                <span className={`activo-estado ${positivo ? "positivo" : "negativo"}`}>
                    {positivo ? "En ganancia" : "En pérdida"}
                </span>
            </div>

            {/* FILA 2: INFORMACIÓN PRINCIPAL */}
            <div className="activo-principal">
                <div className="activo-valor">

                    <span>Valor de la posición</span>
                    <strong>{formatMoney(activo.valor_actual, moneda)}</strong>
                    <small>{activo.cantidad} unidades</small>

                </div>

                <div className={`activo-resultado ${positivo ? "positivo" : "negativo"}`}>
                    <span>Ganancia / Pérdida</span>

                    <strong>
                        {positivo ? "+" : ""}
                        {formatMoney(ganancia, moneda)}
                    </strong>

                    <small>
                        {positivo ? "+" : ""}
                        {rendimiento.toFixed(2)}%
                    </small>
                </div>
            </div>

            {/* FILA 3: INFORMACIÓN SECUNDARIA */}
            <div className="activo-detalles">
                <div>
                    <span>Capital invertido</span>
                    <strong>{formatMoney(activo.capital_invertido, moneda)}</strong>
                </div>

                <div>
                    <span>Precio actual</span>
                    <strong>{formatMoney(activo.precio_actual, moneda)}</strong>
                </div>

                <div>
                    <span>Ultima Cotizacion</span>
                    <strong>{formatExpiration(activo.fecha_precio)}</strong>
                </div>

                <div>
                    <span>Moneda</span>
                    <strong>{moneda}</strong>
                </div>
            </div>
        </article>
    );
}