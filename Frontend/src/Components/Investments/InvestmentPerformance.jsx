import { TrendingUp, CircleDollarSign, LineChart } from "lucide-react";
import formatCOP, { formatPercentage } from "../../Services/utils";
import "./InvestmentPerformance.css";

const formatSigned = (value) => {
    const number = Number(value) || 0;

    if (number === 0) return formatCOP(0);

    return `${number > 0 ? "+" : "-"}${formatCOP(Math.abs(number))}`;
};

export default function InvestmentPerformance({
    ganancia,
    rentabilidadTotal,
    gananciaSobrePatrimonio,
}) {

    const gananciaTotal = Number(ganancia?.total) || 0;
    const gananciaRealizada = Number(ganancia?.realizada) || 0;
    const gananciaNoRealizada = Number(ganancia?.no_realizada) || 0;

    const metrics = [
        {
            key: "total",
            title: "Ganancia total",
            icon: <TrendingUp size={18} />,
            value: formatSigned(gananciaTotal),
            positivo: gananciaTotal >= 0,
        },
        {
            key: "realizada",
            title: "Ganancia realizada",
            icon: <CircleDollarSign size={18} />,
            value: formatSigned(gananciaRealizada),
            positivo: gananciaRealizada >= 0,
        },
        {
            key: "no-realizada",
            title: "No realizada",
            icon: <LineChart size={18} />,
            value: formatSigned(gananciaNoRealizada),
            positivo: gananciaNoRealizada >= 0,
        },
    ];

    const yields = [
        {
            title: "Rentabilidad del capital",
            value: formatPercentage(rentabilidadTotal),
            positivo: Number(rentabilidadTotal) >= 0,
        },
        {
            title: "Ganancia sobre patrimonio",
            value: formatPercentage(gananciaSobrePatrimonio),
            positivo: Number(gananciaSobrePatrimonio) >= 0,
        },
    ];

    return (
        <section className="invest-performance">

            <div className="invest-performance__header">

                <div>
                    <span className="invest-performance__label">
                        Ganancias / rendimiento
                    </span>
                    <h3>Rendimiento de tus inversiones</h3>
                </div>

            </div>

            <div className="invest-performance__metrics">

                {metrics.map((metric) => (
                    <article
                        key={metric.key}
                        className={[
                            "invest-metric",
                            `invest-metric--${metric.key}`,
                            metric.positivo ? "is-positive" : "is-negative",
                        ].join(" ")}
                    >
                        <span className="invest-metric__icon">
                            {metric.icon}
                        </span>

                        <div className="invest-metric__content">
                            <span>{metric.title}</span>
                            <strong>{metric.value}</strong>
                        </div>
                    </article>
                ))}

            </div>

            <div className="invest-performance__yields">

                {yields.map((yieldItem) => (
                    <div
                        key={yieldItem.title}
                        className={[
                            "invest-performance__yield",
                            yieldItem.positivo ? "is-positive" : "is-negative",
                        ].join(" ")}
                    >
                        <span>{yieldItem.title}</span>
                        <strong>{yieldItem.value}</strong>
                    </div>
                ))}

            </div>

        </section>
    );
}