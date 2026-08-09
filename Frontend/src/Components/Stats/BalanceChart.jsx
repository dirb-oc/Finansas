import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from "recharts";
import formatCOP from "../../Services/utils";
import "./BalanceChart.css";

const BalanceChart = ({ patrimonio }) => {
    const data = patrimonio.map((item) => {
        const [year, month] = item.mes.split("-");

        const fecha = new Date(
            Number(year),
            Number(month) - 1,
            1
        );

        return {
            mes: fecha.toLocaleDateString("es-CO", {
                month: "short",
            }),
            total: item.total,
        };
    });

    const CustomTooltip = ({ active, payload, label }) => {

        if (!active || !payload?.length) {
            return null;
        }

        return (
            <div className="balance-tooltip">

                <span className="balance-tooltip__month">
                    {label}
                </span>

                <strong className="balance-tooltip__value">
                    {formatCOP(payload[0].value)}
                </strong>

            </div>
        );
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3>Evolución de Patrimonio</h3>
                <span>Últimos 6 meses</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 10,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient
                            id="patrimonioGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="var(--total)"
                                stopOpacity={0.5}
                            />

                            <stop
                                offset="50%"
                                stopColor="var(--total)"
                                stopOpacity={0.2}
                            />

                            <stop
                                offset="100%"
                                stopColor="var(--total)"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#363636" vertical={false} />

                    <XAxis
                        dataKey="mes"
                        stroke="#94a3b8"
                    />

                    <YAxis
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                            `$${(value / 1000000).toFixed(1)}M`
                        }
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: "#3a4248",
                            strokeDasharray: "4 4",
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--total)"
                        fill="url(#patrimonioGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BalanceChart;