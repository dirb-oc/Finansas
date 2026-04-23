import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, } from "recharts";
import "./CashFlowChart.css";

const formatCOP = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

// 🧠 FIX MES
const getMonthName = (mesStr) => {
    const [year, month] = mesStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return date.toLocaleString("es-CO", { month: "short" });
};

// 🎯 TOOLTIP CUSTOM
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    const ingresos = payload.find(p => p.dataKey === "ingresos")?.value || 0;
    const gastos = payload.find(p => p.dataKey === "gastos")?.value || 0;

    return (
        <div className="tooltip-box">
            <p className="tooltip-title">{label}</p>

            <div className="tooltip-item ingreso">
                <span className="dot green"></span>
                {formatCOP(ingresos)}
            </div>

            <div className="tooltip-item gasto">
                <span className="dot red"></span>
                {formatCOP(gastos)}
            </div>
        </div>
    );
};

export default function CashFlowChart({ data }) {
    const formattedData = data.map((item) => ({
        mes: getMonthName(item.mes),
        ingresos: item.ingresos,
        gastos: item.gastos,
    }));

    return (
        <div className="cashflow-container">
            <div className="cashflow-header">
                <h2>Cash Flow</h2>
                <span>Income vs Expenses</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#334155" />

                    <XAxis dataKey="mes" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />

                    <Tooltip content={<CustomTooltip />} />

                    {/* ✅ COLORES FORZADOS */}
                    <Bar dataKey="ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}