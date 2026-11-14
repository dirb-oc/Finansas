
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import formatCOP, { formatPercentage } from "../../Services/utils";
import { useState } from "react";
import "./ExpensesCategory.css";


function generateColors(type, count) {
    const baseColor = type === "gastos"
        ? "#EF4444"
        : "#00D084";

    const endColor = type === "gastos"
        ? "#FCA5A5"
        : "#a8d1b7";

    if (count <= 1) return [baseColor];

    const hexToRgb = (hex) => ({
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    });

    const rgbToHex = ({ r, g, b }) =>
        "#" + [r, g, b]
            .map(v => Math.round(v).toString(16).padStart(2, "0"))
            .join("");

    const start = hexToRgb(baseColor);
    const end = hexToRgb(endColor);

    return Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);

        return rgbToHex({
            r: start.r + (end.r - start.r) * t,
            g: start.g + (end.g - start.g) * t,
            b: start.b + (end.b - start.b) * t,
        });
    });
}

export default function ExpensesCategory({ gastos_categoria = [], ingreso_categoria = [] }) {
    const tieneGastos = gastos_categoria.length > 0;
    const tieneIngresos = ingreso_categoria.length > 0;

    const [tipo, setTipo] = useState("gastos");

    const tipoActivo = tieneGastos && tieneIngresos ? tipo : tieneGastos ? "gastos" : tieneIngresos ? "ingresos" : "gastos";

    const categorias = tipoActivo === "gastos" ? gastos_categoria : ingreso_categoria;

    const total = categorias.reduce( (sum, categoria) => sum + categoria.monto, 0 );

    const colors = generateColors(tipoActivo, categorias.length);

    const data = categorias.map((categoria) => ({ name: categoria.nombre, value: categoria.monto, }));

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;

        const { name, value } = payload[0].payload;

        const porcentaje = total > 0 ? (value / total) * 100 : 0;

        return (
            <div className="expense-tooltip">
                <span>{name}</span>
                <strong>{formatPercentage(porcentaje)} · {formatCOP(value)}</strong>
            </div>
        );
    };

    return (
        <div className="chart-card Investment">

            <header className="expense-header">
                <div>
                    <h3>Flujo del Mes</h3>
                    <span>
                        {tipoActivo === "gastos"
                            ? "Gastos por categoría"
                            : "Ingresos por categoría"}
                    </span>
                </div>

                {tieneGastos && tieneIngresos && (
                    <div className="expense-tabs">
                        <button
                            className={tipoActivo === "gastos" ? "active" : ""}
                            onClick={() => setTipo("gastos")}
                        >
                            Gastos
                        </button>

                        <button
                            className={tipoActivo === "ingresos" ? "active" : ""}
                            onClick={() => setTipo("ingresos")}
                        >
                            Ingresos
                        </button>
                    </div>
                )}
            </header>

            <div className="expense-content">

                {data.length > 0 ? (
                    <>
                        <div className="expense-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="65%"
                                        outerRadius="90%"
                                        paddingAngle={data.length > 1 ? 3 : 0}
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={colors[index]}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip
                                        content={<CustomTooltip />}
                                        isAnimationActive={false}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="expense-total">
                            <span>Total de {tipoActivo}</span>

                            <strong className={tipoActivo}>{formatCOP(total)}</strong>
                        </div>
                    </>
                ) : (
                    <div className="expense-empty">
                        <div className="expense-empty-icon">📊</div>
                        <h4>Sin movimientos este mes</h4>
                        <p>
                            Cuando registres ingresos o gastos
                            aparecerán aquí.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
