import { CircleDollarSign } from "lucide-react";
import formatCOP from "../../Services/utils";
import InvestmentsSection from "./InvestmentsSection";

export default function DividendsList({ dividendos }) {

    const cantidad = Number(dividendos?.cantidad) || 0;

    const count = `${cantidad} ${cantidad === 1 ? "recibido" : "recibidos"}`;

    return (
        <InvestmentsSection
            label="Ingresos pasivos"
            title="Dividendos"
            tone="dividendos"
            icon={<CircleDollarSign size={18} />}
            count={count}
        >
            <div className="invest-recap">
                
                <div className="invest-recap__stat">
                    <span>Total generado</span>
                    <strong className="positive">
                        +{formatCOP(dividendos?.total)}
                    </strong>
                </div>

            </div>
        </InvestmentsSection>
    );
}