import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import formatCOP from "../../Services/utils";
import "./Transactions.css";

export default function Transactions({ cuenta, onEditMovimiento }) {

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "short"
        });
    };

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
        <div className="transactions-panel">

            <div className="panel">

                <div className="transactionsHeader">
                    <h2>Transacciones</h2>
                    <p>Ingresos y gastos por mes</p>
                </div>

                <div className="transactionsList">

                    {Object.entries(grouped).map(([month, items]) => {

                        const resumenMes = items.reduce(
                            (acc, mov) => {
                                const monto = Number(mov.monto); // 🔥 clave

                                if (mov.tipo_base === "ingreso" || mov.tipo_base === "inicial") {
                                    acc.ingresos += monto;
                                } else if (mov.tipo_base === "gasto") {
                                    acc.gastos += monto;
                                }

                                return acc;
                            },
                            { ingresos: 0, gastos: 0 }
                        );

                        const balance = resumenMes.ingresos - resumenMes.gastos;

                        return (
                            <div key={month} className="mov-group">

                                <div className="mov-group-header">
                                    <div>
                                        <span className="mov-group-title">{month}</span>

                                        <div className="mov-group-sub">
                                            <span className="ingreso">
                                                +{formatCOP(resumenMes.ingresos)}
                                            </span>
                                            <span className="gasto">
                                                -{formatCOP(resumenMes.gastos)}
                                            </span>
                                        </div>
                                    </div>

                                    <span className={`mov-group-balance ${balance > 0 ? "ingreso" : balance < 0 ? "gasto" : "neutral"}`}>
                                        {formatCOP(balance)}
                                    </span>
                                </div>

                                {items.map((mov) => (
                                    <div
                                        key={mov.id}
                                        className="mov-item"
                                        onClick={() => onEditMovimiento(mov)}
                                    >
                                        <div className={`mov-icon ${mov.tipo_base}`}>
                                            {mov.tipo_base === "ingreso"
                                                ? <ArrowUpRight size={22} />
                                                : <ArrowDownRight size={22} />}
                                        </div>

                                        <div className="mov-info">
                                            <div className="mov-title">{mov.tipo_nombre}</div>
                                            <div className="mov-sub">
                                                {formatDate(mov.fecha)}
                                            </div>
                                        </div>

                                        <div className="mov-right">
                                            <div className={`mov-amount ${mov.tipo_base}`}>
                                                {mov.tipo_base === "gasto" ? "-" : "+"}
                                                {formatCOP(mov.monto)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}