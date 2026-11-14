
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import formatCOP, { formatPercentage } from "../../Services/utils";
import "./DonutChart.css";

function generateColors(type, count) {
    const baseColor = type === "gastos" ? "#EF4444" : "#00D084";
    const endColor = type === "gastos" ? "#FCA5A5" : "#a8d1b7";

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

function CustomTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;

    const { name, value } = payload[0].payload;
    const porcentaje = total > 0 ? (value / total) * 100 : 0;

    return (
        <div className="expense-tooltip">
            <span>{name}</span>
            <strong>
                {formatPercentage(porcentaje)} · {formatCOP(value)}
            </strong>
        </div>
    );
}

export default function DonutChart({
    data = [],
    type = "gastos",
    compact = false,
}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = generateColors(type, data.length);


    return (
        <div className={`donut-chart ${compact ? "compact" : ""} horizontal`}>
            {data.length > 0 ? (
                <>
                    <div className="donut-chart__visual">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="65%"
                                    outerRadius="92%"
                                    paddingAngle={data.length > 1 ? 3 : 0}
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`${entry.name}-${index}`}
                                            fill={colors[index]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    content={<CustomTooltip total={total} />}
                                    isAnimationActive={false}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="donut-chart__total">
                        <span>Total de {type}</span>
                        <strong className={type}>
                            {formatCOP(total)}
                        </strong>
                    </div>
                </>
            ) : (
                <div className="expense-empty">
                    <div className="expense-empty-icon">📊</div>
                    <h4>Sin movimientos este mes</h4>
                    <p>Cuando registres movimientos aparecerán aquí.</p>
                </div>
            )}
        </div>
    );

}
