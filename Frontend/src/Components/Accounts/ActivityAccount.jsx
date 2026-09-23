import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import formatCOP, {formatDate} from "../../Services/utils";
import "./ActivityAccount.css";

export default function ActivityAccount({ cuenta, onEditMovimiento, onCreateMovimiento }) {

    const groupByMonth = (movimientos) => {
        return movimientos.reduce((acc, mov) => {
            const date = new Date(mov.fecha);

            let key = date.toLocaleDateString("es-CO", {
                month: "long",
                year: "numeric"
            });

            key = key.charAt(0).toUpperCase() + key.slice(1);

            if (!acc[key]) acc[key] = [];
            acc[key].push(mov);

            return acc;
        }, {});
    };

    const grouped = groupByMonth(cuenta?.movimientos || []);

    return (
        <section className="account-activity-grid">

            <div className="account-activity">

                <div className="account-activity__header">

                    <div>
                        <span className="account-activity__label">Actividad</span>
                        <h3>Movimientos</h3>
                    </div>

                    <Activity size={21} onClick={() => onCreateMovimiento()} />

                </div>

                <div className="account-activity__list">

                    {cuenta.movimientos?.length > 0 ? (

                        cuenta.movimientos.map((mov) => {

                            const ingreso = mov.tipo_base === "ingreso";
                            const monto = Number(mov.monto);
                            const fecha = formatDate(mov.fecha);

                            return (
                                <div
                                    key={mov.id}
                                    className="account-movement"
                                    onClick={() => onEditMovimiento?.(mov) }
                                >

                                    <div className={`account-movement__icon ${ ingreso ? "income" : "expense" }`} >
                                        {ingreso ? <ArrowUpRight size={21} /> : <ArrowDownRight size={21} /> }
                                    </div>

                                    <div className="account-movement__info">

                                        <strong>{mov.tipo_nombre}</strong>
                                        <span>{mov.descripcion || fecha}</span>

                                    </div>


                                    <div className="account-movement__date">{fecha}</div>


                                    <strong className={`account-movement__amount ${ ingreso ? "income" : "expense"}`} >
                                        {ingreso ? "+" : "-"}
                                        {formatCOP(monto)}
                                    </strong>

                                </div>
                            );
                        })

                    ) : (

                        <div className="account-activity__empty">
                            <Activity size={28} />

                            <span>No hay movimientos registrados</span>
                        </div>

                    )}

                </div>

            </div>

            {/* DISTRIBUCIÓN */}

            <div className="account-distribution">

                <div className="account-distribution__header">

                    <div>
                        <span className="account-distribution__label">
                            Análisis
                        </span>

                        <h3>Distribución</h3>
                    </div>

                    <span>{cuenta.mes_resumen}</span>

                </div>


                <div className="distribution-section">

                    <div className="distribution-section__title">
                        <TrendingDown size={17} />
                        <span>Gastos</span>
                    </div>


                    <div className="distribution-list">

                        {cuenta.impacto?.gastos?.length > 0 ? (

                            cuenta.impacto.gastos.map((item) => (

                                <div key={item.nombre} className="distribution-item" >

                                    <div className="distribution-item__header">

                                        <span>{item.nombre}</span>

                                        <strong>{formatCOP(item.total)}</strong>

                                    </div>


                                    <div className="distribution-bar">

                                        <div
                                            className="distribution-bar__fill expense"
                                            style={{ width: `${item.porcentaje}%` }}
                                        />

                                    </div>


                                    <span className="distribution-item__percentage">
                                        {item.porcentaje}%
                                    </span>

                                </div>

                            ))

                        ) : (

                            <span className="distribution-empty">Sin gastos registrados</span>

                        )}

                    </div>

                </div>


                <div className="distribution-section">

                    <div className="distribution-section__title">
                        <TrendingUp size={17} />
                        <span>Ingresos</span>
                    </div>


                    <div className="distribution-list">

                        {cuenta.impacto?.ingresos?.length > 0 ? (

                            cuenta.impacto.ingresos.map((item) => (

                                <div key={item.nombre} className="distribution-item" >

                                    <div className="distribution-item__header">

                                        <span>{item.nombre}</span>
                                        <strong>{formatCOP(item.total)}</strong>

                                    </div>


                                    <div className="distribution-bar">

                                        <div
                                            className="distribution-bar__fill income"
                                            style={{ width: `${item.porcentaje}%` }}
                                        />

                                    </div>


                                    <span className="distribution-item__percentage">
                                        {item.porcentaje}%
                                    </span>

                                </div>

                            ))

                        ) : (

                            <span className="distribution-empty">Sin ingresos registrados</span>

                        )}

                    </div>

                </div>

            </div>

        </section>
    );
}