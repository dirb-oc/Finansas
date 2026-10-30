import { CircleDollarSign, PiggyBank } from "lucide-react";
import formatCOP from "../../Services/utils";
import InvestmentsSection from "./InvestmentsSection";

function IncomeColumn({ icon, title, subtitle, total }) {
    return (
        <div className="invest-recap">
            <div className="invest-income__heading">
                <span className="invest-income__icon">{icon}</span>

                <div className="invest-income__meta">
                    <strong>{title}</strong>
                    <span>{subtitle}</span>
                </div>
            </div>

            <div className="invest-recap__stat">
                <span>Total generado</span>
                <strong className="positive">
                    +{formatCOP(total)}
                </strong>
            </div>

        </div>
    );
}

export default function IncomeSummary({ dividendos, rendimientos }) {

    const cantidadDividendos = Number(dividendos?.cantidad) || 0;
    const cantidadRendimientos = Number(rendimientos?.cantidad) || 0;

    const totalRegistros = cantidadDividendos + cantidadRendimientos;

    const count = `${totalRegistros} ${totalRegistros === 1 ? "registro" : "registros"}`;

    return (
        <InvestmentsSection
            label="Ingresos"
            title="Dividendos y rendimientos"
            tone="ingresos"
            count={count}
        >
            <div className="invest-income">

                <IncomeColumn
                    icon={<CircleDollarSign size={16} />}
                    title="Dividendos"
                    subtitle={`${cantidadDividendos} ${cantidadDividendos === 1 ? "recibido" : "recibidos"}`}
                    total={dividendos?.total}
                />

                <IncomeColumn
                    icon={<PiggyBank size={16} />}
                    title="Rendimientos"
                    subtitle={`${cantidadRendimientos} ${cantidadRendimientos === 1 ? "registrado" : "registrados"}`}
                    total={rendimientos?.total}
                />

            </div>
        </InvestmentsSection>
    );
}