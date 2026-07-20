import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import formatCOP from "../Services/utils";
import "./Accounts.css";

const COLORS = [
    "#820AD1",
    "#22C55E",
    "#E6007E",
    "#333333",
    "#222222",
];

export default function Accounts({ data }) {

    function formatCompactMoney(value) {
        const abs = Math.abs(value);

        const truncate = (num, decimals = 1) => {
            const factor = 10 ** decimals;
            return Math.trunc(num * factor) / factor;
        };

        if (abs >= 1_000_000_000)
            return `${truncate(value / 1_000_000_000)}B`;

        if (abs >= 1_000_000)
            return `${truncate(value / 1_000_000)}M`;

        if (abs >= 1_000)
            return `${truncate(value / 1_000)}K`;

        return value.toString();
    }

    return (
        <div className="chart-card">

            <div className="distribution-header">
                <h3>Cuentas y distribución</h3>
                <span>Liquidez total: {formatCOP(data.disponible)}</span>
            </div>

            <div className="distribution-body">

                <div className="distribution-chart">

                    <ResponsiveContainer width="100%" height={260} >
                        <PieChart>

                            <Pie
                                data={data.cuentas}
                                dataKey="saldo"
                                innerRadius={75}
                                outerRadius={100}
                                paddingAngle={3}
                                stroke="none"
                            >
                                {data.cuentas.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <text
                                x="50%"
                                y="47%"
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="30"
                                fontWeight="bold"
                            >
                                {formatCompactMoney(data.disponible)}
                            </text>

                            <text
                                x="50%"
                                y="59%"
                                textAnchor="middle"
                                fill="#9ca3af"
                                fontSize="16"
                            >
                                Total
                            </text>

                        </PieChart>

                    </ResponsiveContainer>

                </div>

                <div className="distribution-list">

                    {data.cuentas.map((cuenta, index) => (

                        <div className="account-item" key={index} >

                            <div className="account-dot" style={{ background: COLORS[index] }} />

                            <div className="account-info">

                                <div className="account-row">


                                    <Link to={`/cuentas/${cuenta.id}`}>
                                        <span className="account-name">{cuenta.nombre}</span>
                                    </Link>

                                    <span className="account-money">{formatCOP(cuenta.saldo)}</span>

                                </div>

                                <div className="account-row">

                                    <span className="account-percent">{cuenta.porcentaje}%</span>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}