
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import "./MoneyDistribution.css";

const COLORS = ["var(--accent-blue)", "var(--investment)"];

export default function MoneyDistribution({ disponible = 0, invertido = 0 }) {
    const total = disponible + invertido;

    const data = [
        { name: "Disponible", value: disponible },
        { name: "Invertido", value: invertido },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;

        const { name, value } = payload[0].payload;
        const porcentaje = total > 0
            ? ((value / total) * 100).toFixed(2)
            : "0.0";

        return (
            <div className="custom-pie-tooltip">
                <span>{name}</span>
                <strong>{porcentaje}%</strong>
            </div>
        );
    };

    return (
        <Link to={`/inversiones/`} className="chart-card Investment MoneyDistribution">

            <header className="money-distribution-header">
                <h3>Distribución</h3>
                <span>Dinero disponible e invertido</span>
            </header>

            <div className="money-distribution-content">

                <div className="money-distribution-chart">
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
                                paddingAngle={total > 0 ? 3 : 0}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index]} />
                                ))}
                            </Pie>

                            <Tooltip
                                content={<CustomTooltip />}
                                isAnimationActive={false}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                </div>

                <div className="money-distribution-legend">
                    {data.map((item, index) => (
                        <div className="money-legend-item" key={item.name}>
                            <span
                                className="money-dot"
                                style={{ background: COLORS[index] }}
                            />
                            <span>{item.name}</span>
                        </div>
                    ))}
                </div>

            </div>
        </Link>
    );
}
