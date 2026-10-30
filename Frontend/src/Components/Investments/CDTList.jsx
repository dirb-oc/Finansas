import { Building2 } from "lucide-react";
import formatCOP from "../../Services/utils";
import InvestmentsSection from "./InvestmentsSection";

const formatVencimiento = (date) => {
    if (!date) return "Sin vencimientos próximos";

    const [year, month, day] = date.split("T")[0].split("-").map(Number);

    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function CDTList({ cdts }) {

    const cantidad = Number(cdts?.cantidad) || 0;

    const count = `${cantidad} CDT${cantidad === 1 ? "" : "s"}`;

    return (
        <InvestmentsSection label="Renta fija" title="CDT" tone="cdt" icon={<Building2 size={18} />} count={count}>
            <div className="invest-recap">
                <div className="invest-recap__stat">
                    <span>Capital</span>
                    <strong>{formatCOP(cdts?.capital)}</strong>
                </div>

                <div className="invest-recap__stat">
                    <span>Próximo vencimiento</span>
                    <strong>{formatVencimiento(cdts?.proximo_vencimiento)}</strong>
                </div>
                
            </div>
        </InvestmentsSection>
    );
}