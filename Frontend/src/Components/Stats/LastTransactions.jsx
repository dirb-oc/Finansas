import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

import formatCOP from "../../Services/utils";
import "./LastTransactions.css";

export default function LastTransactions({ movimientos = [] }) {

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);

        return date.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "short",
        });
    };

    return (
        <div className="chart-card">

            <div className="chart-header">
                <h3>Últimos movimientos</h3>
                <span>Los movimientos mas recientes</span>
            </div>

            {movimientos.length === 0 ? (

                <div className="transactions-empty">
                    <p>No hay movimientos recientes</p>
                </div>

            ) : (

                movimientos.map((mov) => {

                    const esIngreso =
                        mov.categoria === "ingreso" ||
                        mov.categoria === "inicial";

                    const esGasto = mov.categoria === "gasto";

                    return (
                        
                        <Link to={`/cuentas/${mov.idcuenta}/`} 
                            key={mov.id}
                            className="mov-item"
                        >

                            <div className={`mov-icon ${esIngreso ? "ingreso" : "gasto" }`} >
                                {esIngreso ? (
                                    <ArrowUpRight size={22} />
                                ) : (
                                    <ArrowDownRight size={22} />
                                )}
                            </div>

                            <div className="mov-info">

                                <div className="mov-title">
                                    {mov.tipo}
                                </div>

                                <div className="mov-sub">
                                    <strong>{mov.cuenta}</strong> · {formatDate(mov.fecha)}
                                </div>

                            </div>

                            <div className="mov-right">

                                <div
                                    className={`mov-amount ${esIngreso
                                            ? "ingreso"
                                            : "gasto"
                                        }`}
                                >
                                    {esGasto ? "-" : "+"}
                                    {formatCOP(mov.monto)}
                                </div>

                            </div>

                        </Link>
                    );
                })

            )}

        </div>
    );
}
