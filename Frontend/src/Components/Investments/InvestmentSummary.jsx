import { Landmark, PiggyBank, TrendingUp, Percent } from "lucide-react";
import formatCOP, { formatPercentage } from "../../Services/utils";
import "./InvestmentSummary.css";

const formatSigned = (value) => {
    const number = Number(value) || 0;

    if (number === 0) return formatCOP(0);

    return `${number > 0 ? "+" : "-"}${formatCOP(Math.abs(number))}`;
};

function SummaryCard({ card }) {

    const className = [
        "invest-card",
        `invest-card--${card.key}`,
        card.negativo ? "invest-card--negative" : "",
    ].filter(Boolean).join(" ");

    return (
        <article className={className}>
            <div className="invest-card__header">
                <span className="invest-card__icon">
                    {card.icon}
                </span>
                <span className="invest-card__label">
                    {card.title}
                </span>
            </div>

            <div className="invest-card__main">
                <strong className="invest-card__value">
                    {card.value}
                </strong>

            </div>

            <span className="invest-card__accent" />
        </article>
    );
}

export default function InvestmentSummary({ patrimonio, cantidadInvertida, ganancia, rentabilidadTotal, gananciaSobrePatrimonio, }) {

    const gananciaTotal = Number(ganancia?.total) || 0;
    const gananciaRealizada = Number(ganancia?.realizada) || 0;
    const gananciaNoRealizada = Number(ganancia?.no_realizada) || 0;

    const cards = [
        {
            key: "patrimonio",
            title: "Patrimonio",
            icon: <Landmark size={18} />,
            value: formatCOP(patrimonio),
        },
        {
            key: "invertido",
            title: "Invertido",
            icon: <PiggyBank size={18} />,
            value: formatCOP(cantidadInvertida),
        },
        {
            key: "ganancia",
            title: "Ganancia total",
            icon: <TrendingUp size={18} />,
            value: formatSigned(gananciaTotal),
            negativo: gananciaTotal < 0,
            sub: `Realizada ${formatSigned(gananciaRealizada)} · No realizada ${formatSigned(gananciaNoRealizada)}`,
        },
        {
            key: "rentabilidad",
            title: "Rentabilidad",
            icon: <Percent size={18} />,
            value: formatPercentage(rentabilidadTotal),
            negativo: Number(rentabilidadTotal) < 0,
            sub: `Sobre patrimonio ${formatPercentage(gananciaSobrePatrimonio)}`,
        },
    ];

    return (
        <section className="invest-summary" aria-label="Resumen de inversiones">
            {cards.map((card) => (
                <SummaryCard key={card.key} card={card} />
            ))}
        </section>
    );
}