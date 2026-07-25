
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import formatCOP from "../../Services/utils";
import "./Totals.css";

export default function Totals({ cuenta }) {

    return (

        <div className="summary-card">

            <div className="summary-header">
                <h2>Totales</h2>
                <p>Resumen global de la cuenta</p>
            </div>

            <div className="balance-card">

                <div className="balance-title">

                    <Wallet size={20} />
                    <span>Balance disponible</span>

                </div>

                <p className="total-value">{formatCOP(cuenta.saldo)}</p>

            </div>

            <div className="resume-grid">

                <div className="resume-box income">

                    <div className="resume-top">

                        <div className="resume-icon"><ArrowUpRight size={18} /></div>
                        <span>Ingresos</span>

                    </div>

                    <p>{formatCOP(cuenta.ingresos_total)}</p>

                </div>

                <div className="resume-box expense">

                    <div className="resume-top">

                        <div className="resume-icon"><ArrowDownRight size={18} /></div>
                        <span>Gastos</span>

                    </div>

                    <p>{formatCOP(cuenta.gastos_total)}</p>

                </div>

            </div>

            <ImpactSection
                titulo="Impacto de gastos"
                color="var(--spent)"
                data={cuenta.impacto.gastos}
            />

            <ImpactSection
                titulo="Impacto de ingresos"
                color="var(--income)"
                data={cuenta.impacto.ingresos}
            />

        </div>

    );
}

const ImpactSection = ({ titulo, color, data }) => (
    <div className="impact-section">

        <h3>{titulo}</h3>

        {data.map((item) => (

            <div key={item.nombre} className="impact-row">

                <span className="impact-name">
                    {item.nombre}
                </span>

                <span className="impact-percent">
                    {item.porcentaje}%
                </span>

                <div className="impact-bar">
                    <div
                        className="impact-fill"
                        style={{
                            width: `${item.porcentaje}%`,
                            background: color
                        }}
                    />
                </div>

                <span className="impact-total">
                    {formatCOP(item.total)}
                </span>

            </div>

        ))}

    </div>
);