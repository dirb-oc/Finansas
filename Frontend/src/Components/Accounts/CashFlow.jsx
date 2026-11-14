
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, } from "recharts";

import formatCOP from "../../Services/utils";
import "./CashFlow.css";

const getMonthName = (mesStr) => {
    if (!mesStr) return "";

    const [year, month] = mesStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return date.toLocaleString("es-CO", { month: "short" })
        .replace(".", "")
        .replace(/^./, letter => letter.toUpperCase());
};

const formatCompactCOP = (value) => {
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(0)}K`;
    }

    return formatCOP(value);
};

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const ingresos = Number(
        payload.find(item => item.dataKey === "ingresos")?.value || 0
    );

    const gastos = Number(
        payload.find(item => item.dataKey === "gastos")?.value || 0
    );

    const balance = ingresos - gastos;

    return (
        <div className="tooltip-box">
            <p className="tooltip-title">{label}</p>

            <div className="tooltip-item ingreso">
                <span className="dot green" />
                <span>Ingresos</span>
                <strong>{formatCOP(ingresos)}</strong>
            </div>

            <div className="tooltip-item gasto">
                <span className="dot red" />
                <span>Gastos</span>
                <strong>{formatCOP(gastos)}</strong>
            </div>

            <div className={`tooltip-item balance ${balance >= 0 ? "positive" : "negative"}`}>
                <span className="dot blue" />
                <span>Balance</span>
                <strong>{formatCOP(balance)}</strong>
            </div>
        </div>
    );
}

export default function CashFlow({ data = [] }) {
    const formattedData = [...data].reverse().map(item => ({
        mes: getMonthName(item.mes),
        ingresos: Number(item.ingresos) || 0,
        gastos: Number(item.gastos) || 0,
    }));

    return (
        <>
            <div className="cashflow-header">
                <div>
                    <h2>Flujo de caja</h2>
                    <span>Últimos {formattedData.length || 3} meses</span>
                </div>

                <div className="cashflow-legend">
                    <span><i className="green" /> Ingresos</span>
                    <span><i className="red" /> Gastos</span>
                </div>
            </div>

            {formattedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={270}>
                    <BarChart
                        data={formattedData}
                        margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                        barGap={5}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="mes"
                            stroke="#94a3b8"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            stroke="#94a3b8"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            tickFormatter={formatCompactCOP}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--bg-secondary)", opacity: 0.5 }}
                        />

                        <Bar
                            dataKey="ingresos"
                            name="Ingresos"
                            fill="#10b981"
                            radius={[5, 5, 0, 0]}
                            maxBarSize={80}
                        />

                        <Bar
                            dataKey="gastos"
                            name="Gastos"
                            fill="var(--spent)"
                            radius={[5, 5, 0, 0]}
                            maxBarSize={80}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="cashflow-empty">
                    <span>No hay movimientos para mostrar</span>
                </div>
            )}
        </>
    );
}
