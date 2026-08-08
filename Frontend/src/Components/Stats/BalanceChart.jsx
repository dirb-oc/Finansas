import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, } from "recharts";
import formatCOP from "../../Services/utils";
import './BalanceChart.css'

export default function BalanceChart({ data }) {

    const values = data.map(d => d.total);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.2, 5000);

    const formatMonth = (mes) => {
        const [year, month] = mes.split("-");
        const date = new Date(year, month - 1); // 👈 clave
        return date.toLocaleString("en-US", { month: "short" });
    };

    const formatMoney = (value) => {
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
        return `$${value}`;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        const [year, month] = label.split("-");
        const date = new Date(year, month - 1);

        const mes = date.toLocaleString("en-US", { month: "short" });

        const value = payload[0].value;

        return (
            <div style={styles.tooltip}>
                <div style={styles.month}>{mes}</div>
                <div style={styles.value}>{formatCOP(value)}</div>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3>Evolucion de Patrimonio</h3>
                <span>Ultimos 6 meses</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00c896" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#00c896" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#363636" vertical={false} />

                    <XAxis dataKey="mes" tickFormatter={formatMonth} stroke="#aaa" />

                    <YAxis
                        domain={[
                            Math.max(0, min - padding), // 👈 evita negativos
                            max + padding
                        ]}
                        tickFormatter={formatMoney}
                        stroke="#aaa"
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="none"
                        fill="url(#colorBalance)"
                    />

                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#00c896"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

const styles = {
    tooltip: {
        background: "#0b0f17",
        border: "1px solid #1f2937",
        padding: "8px 12px",
        borderRadius: "8px",
    },
    month: {
        color: "#e5e7eb",
        fontSize: "14px",
        marginBottom: "4px",
    },
    value: {
        color: "#00c896", // 👈 verde
        fontSize: "16px",
        fontWeight: "bold",
    },
};