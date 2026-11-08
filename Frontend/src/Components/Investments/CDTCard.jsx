import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

import formatCOP from "../../Services/utils";
import "./CDTCard.css";

const formatVencimiento = (date) => {
    if (!date) return "Sin vencimientos próximos";

    const [year, month, day] = date.split("T")[0].split("-").map(Number);

    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

export default function CDTCard({ cdts }) {
    const cantidad = Number(cdts?.cantidad) || 0;
    const capital = Number(cdts?.capital) || 0;
    const vencimiento = cdts?.proximo_vencimiento;

    return (
        <Link to="/CDT/" className="cdt-panel">
            <div className="cdt-summary-header">
                <div className="cdt-summary-title">
                    <Building2 size={20} />
                    <h3>Renta fija · CDT</h3>
                </div>

                <span className="cdt-summary-count">
                    {cantidad} CDT{cantidad === 1 ? "" : "s"} Activos
                </span>
            </div>

            <div className="cdt-summary-content">
                <div className="cdt-summary-invested">
                    <span>Cantidad invertida</span>
                    <strong className="cdt-invested">{formatCOP(capital)}</strong>
                </div>

                <div className="cdt-summary-maturity">
                    <span>Próximo vencimiento</span>
                    <strong>{formatVencimiento(vencimiento)}</strong>
                </div>
            </div>
        </Link>
    );
}