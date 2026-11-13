
import { CircleDollarSign, PiggyBank } from "lucide-react";
import formatCOP from "../../Services/utils";
import "./IncomeSummary.css";

export default function IncomeSummary({
    dividendos,
    rendimientos,
    onCreateRendimiento
}) {
    return (
        <div className="invest-income">
            <IncomeItem
                icon={<CircleDollarSign size={18} />}
                title="Dividendos"
                cantidad={dividendos?.cantidad}
                total={dividendos?.total}
                singular="recibido"
            />

            <IncomeItem
                icon={<PiggyBank size={18} />}
                title="Rendimientos"
                cantidad={rendimientos?.cantidad}
                total={rendimientos?.total}
                singular="registrado"
                onClick={onCreateRendimiento}
            />
        </div>
    );
}

function IncomeItem({
    icon,
    title,
    cantidad,
    total,
    singular,
    onClick
}) {
    const count = Number(cantidad) || 0;

    return (
        <div
            className={`invest-income__item ${onClick ? "clickable" : ""}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
        >
            <div className="invest-income__info">
                <span className="invest-income__icon">{icon}</span>

                <div>
                    <strong>{title}</strong>
                    <span>
                        {count} {singular}{count === 1 ? "" : "s"}
                    </span>
                </div>
            </div>

            <strong className="invest-income__total positive">
                +{formatCOP(total)}
            </strong>
        </div>
    );
}
