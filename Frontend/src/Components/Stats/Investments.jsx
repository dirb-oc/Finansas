import formatCOP from "../../Services/utils";
import { Link } from "react-router-dom";
import "./Investments.css";

export default function Investments({ inversiones }) {

    const total = inversiones.reduce(
        (sum, inv) => sum + inv.monto,
        0
    );

    return (
        <div className="chart-card Investment">

            <h3>Distribución de <Link to="/inversiones/">inversiones</Link></h3>
            <span>Total invertido {formatCOP(total)}</span>

            <div className="investment-list">

                <div className="investment-list">

                    {inversiones.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">📈</div>

                            <h4>No hay Inversiones activas</h4>
                            <p>Registra una inversiónpara visualizarla aquí. </p>

                        </div>

                    ) : (

                        inversiones.map((inv) => {

                            const porcentaje = total === 0 ? 0 : (inv.monto / total) * 100;

                            return (

                                <div key={inv.id} className="investment-item" >

                                    <div className="investment-info">

                                        <span className="investment-name"> {inv.nombre} </span>

                                        <span className="investment-money">{formatCOP(inv.monto)}</span>

                                    </div>

                                    <div className="investment-progress">

                                        <div className="progress-bar">

                                            <div className="progress-fill" style={{ width: `${porcentaje}%` }} />

                                        </div>

                                        <span className="investment-percent">{porcentaje.toFixed(1)}%</span>

                                    </div>

                                </div>

                            );

                        })
                    )}

                </div>



            </div>

        </div>
    );
}