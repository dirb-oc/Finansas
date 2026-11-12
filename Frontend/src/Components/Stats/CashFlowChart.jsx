import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

import formatCOP from "../../Services/utils";
import "./CashFlowChart.css";


const getMonthName = (mesStr) => {
    const [year, month] = mesStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("es-CO", { month: "short" });
};

const formatCompactCOP = (value) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;

    return formatCOP(value);
};

// 🎯 TOOLTIP CUSTOM
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const ingresos = payload.find((p) => p.dataKey === "ingresos")?.value || 0;

    const gastos = payload.find((p) => p.dataKey === "gastos")?.value || 0;

    const balance = ingresos - gastos;

    return (
        <div className="tooltip-box">
            <p className="tooltip-title">{label}</p>

            <div className="tooltip-item ingreso">
                <span className="dot green"></span>
                <span>Ingresos:</span>
                <strong>{formatCOP(ingresos)}</strong>
            </div>

            <div className="tooltip-item gasto">
                <span className="dot red"></span>
                <span>Gastos:</span>
                <strong>{formatCOP(gastos)}</strong>
            </div>

            {/* ✅ BALANCE */}
            <div
                className={`tooltip-item balance ${balance >= 0 ? "positive" : "negative"}`}>
                <span className="dot blue"></span>
                <span>Balance:</span>
                <strong>{formatCOP(balance)}</strong>
            </div>
        </div>
    );
};

export default function CashFlowChart({ data }) {
    const formattedData = data.map((item) => ({
        mes: getMonthName(item.mes),
        ingresos: item.ingresos,
        gastos: item.gastos,
        balance: item.ingresos - item.gastos,
    }));

    return (
        <div className="cashflow-container">
            <div className="cashflow-header">
                <h2>Flujo de Caja</h2>
                <span>Ultimos 6 Meses</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#363636" vertical={false} />

                    <XAxis dataKey="mes" stroke="#94a3b8" />

                    <YAxis
                        stroke="#94a3b8"
                        tickFormatter={formatCompactCOP}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Bar
                        dataKey="ingresos"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                    />

                    <Bar
                        dataKey="gastos"
                        fill="var(--spent)"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}