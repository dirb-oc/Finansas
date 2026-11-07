import formatCOP, { formatExpiration } from "../../Services/utils";
import "./CDTList.css";

function CDTFinalizadoItem({ cdt }) {
    const capital = Number(cdt.capital || 0);
    const retornado = Number(cdt.valor_reintegro || 0);

    const rendimiento = retornado - capital;

    const rentabilidad = capital > 0
        ? (rendimiento / capital) * 100
        : 0;

    const positivo = rendimiento >= 0;

    return (
        <article className="cdt-finished-item">

            <div className="cdt-finished-values">

                <div>
                    <div>
                        <h3>{cdt.entidad}</h3>
                        <span className="cdt-card-label">
                            {formatExpiration(cdt.fecha_inicio)} — {formatExpiration(cdt.fecha_cierre)}
                        </span>
                    </div>
                </div>

                <div>
                    <span className="cdt-card-label">Capital invertido</span>
                    <strong>{formatCOP(capital)}</strong>
                </div>

                <div>
                    <span className="cdt-card-label">Cantidad retornada</span>
                    <strong>{formatCOP(retornado)}</strong>
                </div>

                <div>
                    <span className="cdt-card-label">Rendimiento</span>
                    <strong className={positivo ? "cdt-positive" : "cdt-negative"}>
                        {positivo ? "+" : ""}{formatCOP(rendimiento)}
                    </strong>
                </div>

                <div>
                    <strong className={`cdt-return-badge ${positivo ? "positive" : "negative"}`}>
                        {positivo ? "+" : ""}{rentabilidad.toFixed(2)}%
                    </strong>
                </div>

            </div>

        </article>
    );
}

export default function CDTList({ cdts = [] }) {

    const ordenados = [...cdts].sort(
        (a, b) => (b.fecha_cierre || "").localeCompare(a.fecha_cierre || "")
    );

    return (
        <section className="cdt-section cdt-section-finished">

            <div className="cdt-section-heading">
                <div>
                    <h2>CDTs finalizados</h2>
                    <p>Historial y rendimiento de tus inversiones</p>
                </div>

                <span className="cdt-section-count">
                    {cdts.length} registros
                </span>
            </div>

            {ordenados.length > 0 ? (
                <div className="cdt-finished-list">
                    {ordenados.map(cdt => (
                        <CDTFinalizadoItem key={cdt.id} cdt={cdt} />
                    ))}
                </div>
            ) : (
                <div className="cdt-empty">
                    Todavía no tienes CDTs finalizados.
                </div>
            )}

        </section>
    );
}