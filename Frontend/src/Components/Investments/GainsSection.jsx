import { TrendingUp, CircleDollarSign, LineChart } from "lucide-react";
import formatCOP, { formatPercentage } from "../../Services/utils";
import "./GainsSection.css";

const formatSigned = (value) => {
    const number = Number(value) || 0;

    if (number === 0) return formatCOP(0);

    return `${number > 0 ? "+" : "-"}${formatCOP(Math.abs(number))}`;
};

export default function GainsSection({
    ganancia,
    rentabilidadTotal,
    gananciaSobrePatrimonio,
}) {

    const gananciaTotal = Number(ganancia?.total) || 0;
    const gananciaRealizada = Number(ganancia?.realizada) || 0;
    const gananciaNoRealizada = Number(ganancia?.no_realizada) || 0;

    const porRealizada = gananciaTotal > 0
        ? Math.round((gananciaRealizada / gananciaTotal) * 100)
        : 0;

    const porNoRealizada = gananciaTotal > 0
        ? Math.round((gananciaNoRealizada / gananciaTotal) * 100)
        : 0;

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
            title: "Ganancia no realizada",
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
        <section className="gains-section" aria-label="Ganancias de tus inversiones">

            <div className="gains-section__header">

                <div>
                    <span className="gains-section__label">
                        Ganancias
                    </span>
                    <h3>Detalle de tus ganancias</h3>
                </div>

            </div>

            <div className="gains-section__metrics">

                {metrics.map((metric) => (
                    <article
                        key={metric.key}
                        className={[
                            "gains-metric",
                            `gains-metric--${metric.key}`,
                            metric.positivo ? "is-positive" : "is-negative",
                        ].join(" ")}
                    >
                        <span className="gains-metric__icon">
                            {metric.icon}
                        </span>

                        <div className="gains-metric__content">
                            <span>{metric.title}</span>
                            <strong>{metric.value}</strong>
                        </div>
                    </article>
                ))}

            </div>

            <div className="gains-section__bar">

                <div className="gains-section__bar-top">
                    <span>Distribución de la ganancia</span>
                    <strong>Realizada {porRealizada}% · No realizada {porNoRealizada}%</strong>
                </div>

                <div className="gains-section__bar-track">
                    <div
                        className="gains-section__bar-fill realized"
                        style={{ width: `${porRealizada}%` }}
                    />
                    <div
                        className="gains-section__bar-fill unrealized"
                        style={{ width: `${porNoRealizada}%` }}
                    />
                </div>

                <div className="gains-section__bar-legend">
                    <span className="is-realized">
                        <i /> Realizada {porRealizada}%
                    </span>
                    <span className="is-unrealized">
                        <i /> No realizada {porNoRealizada}%
                    </span>
                </div>

            </div>

            <div className="gains-section__yields">

                {yields.map((item) => (
                    <div
                        key={item.title}
                        className={[
                            "gains-section__yield",
                            item.positivo ? "is-positive" : "is-negative",
                        ].join(" ")}
                    >
                        <span>{item.title}</span>
                        <strong>{item.value}</strong>
                    </div>
                ))}

            </div>

        </section>
    );
}