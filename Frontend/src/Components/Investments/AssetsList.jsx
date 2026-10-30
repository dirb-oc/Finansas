import { LineChart } from "lucide-react";
import formatCOP from "../../Services/utils";
import InvestmentsSection from "./InvestmentsSection";

const formatSigned = (value) => {
    const number = Number(value) || 0;

    if (number === 0) return formatCOP(0);

    return `${number > 0 ? "+" : "-"}${formatCOP(Math.abs(number))}`;
};

export default function AssetsList({ activos }) {

    const cantidad = Number(activos?.cantidad) || 0;

    const count = `${cantidad} ${cantidad === 1 ? "activo" : "activos"}`;

    const ganancia = Number(activos?.ganancia) || 0;

    return (
        <InvestmentsSection label="Cartera" title="Activos" icon={<LineChart size={18} />} count={count}>
            <div className="invest-recap">
                <div className="invest-recap__stat">
                    <span>Capital invertido</span>
                    <strong>{formatCOP(activos?.capital_invertido)}</strong>
                </div>

                <div className="invest-recap__stat">
                    <span>Valor actual</span>
                    <strong>{formatCOP(activos?.valor_actual)}</strong>
                </div>

                <div className="invest-recap__stat">
                    <span>Ganancia</span>
                    <strong className={ganancia >= 0 ? "positive" : "negative"}>
                        {formatSigned(ganancia)}
                    </strong>
                </div>
            </div>
        </InvestmentsSection>
    );
}