import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import formatCOP, {formatDate} from "../../Services/utils";
import CashFlow from "./CashFlow";
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

            <div className="account-motion">

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
                <CashFlow data={cuenta.flujo_caja || []} />
            </div>

        </section>
    );
}