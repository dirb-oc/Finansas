import formatCOP, { formatExpiration } from "../../Services/utils";

import "./CDTActivos.css";

function CDTActivoCard({ cdt }) {

    return (
        <article className="cdt-active-card">

            <header className="cdt-active-header">
                <h3>{cdt.entidad}</h3>
                <strong>{formatCOP(cdt.capital)}</strong>
            </header>


            <div className="cdt-active-dates">
                <div>
                    <span className="cdt-card-label">Fecha de inicio</span>
                    <strong>{formatExpiration(cdt.fecha_inicio)}</strong>
                </div>

                <div>
                    <span className="cdt-card-label">Vencimiento</span>
                    <strong>{formatExpiration(cdt.fecha_vencimiento)}</strong>
                </div>
            </div>

            <div className="cdt-progress-section">

                <div className="cdt-progress-header">
                    <span>Progreso del CDT</span>
                    <strong>{cdt.progreso}%</strong>
                </div>

                <div className="cdt-progress-track">
                    <div
                        className={`cdt-progress-fill`}
                        style={{ width: `${cdt.progreso}%` }}
                    />
                </div>

                <div className="cdt-progress-footer">
                    <span>{100 - cdt.progreso}% restante</span>

                    <strong className="cdt-expired">
                        {cdt.dias_restantes === 0
                            ? "Vencido"
                            : `${cdt.dias_restantes} días restantes`}
                    </strong>

                </div>

            </div>

        </article>
    );
}

export default function CDTActivos({ cdts = [] }) {

    const ordenados = [...cdts].sort(
        (a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
    );

    return (
        <section className="cdt-section cdt-section-active">

            <div className="cdt-section-heading">
                <div>
                    <h2>CDTs activos</h2>
                    <p>Seguimiento de tus inversiones actuales</p>
                </div>

                <span className="cdt-section-count">
                    {cdts.length} activos
                </span>
            </div>

            {ordenados.length > 0 ? (
                <div className="cdt-active-grid">
                    {ordenados.map(cdt => (
                        <CDTActivoCard key={cdt.id} cdt={cdt} />
                    ))}
                </div>
            ) : (
                <div className="cdt-empty">
                    No tienes CDTs activos.
                </div>
            )}

        </section>
    );
}