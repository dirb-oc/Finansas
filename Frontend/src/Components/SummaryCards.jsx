import "./SummaryCards.css";

function SummaryCard({ card }) {
    const className = [
        "summary-card",
        card.key ? `summary-card--${card.key}` : "",
        card.negative ? "summary-card--negative" : "",
    ].filter(Boolean).join(" ");

    return (
        <article className={className}>
            <div className="summary-card__header">
                <span className="summary-card__icon">
                    {card.icon}
                </span>

                <span className="summary-card__label">
                    {card.title}
                </span>
            </div>

            <div className="summary-card__main">
                <strong className="summary-card__value">
                    {card.value}
                </strong>

                {card.subtitle && (
                    <span className="summary-card__subtitle">
                        {card.subtitle}
                    </span>
                )}
            </div>

            <span className="summary-card__accent" />
        </article>
    );
}

export default function SummaryCards({ cards = [], className = "", ariaLabel = "Resumen", }) {
    return (
        <section
            className={`summary-cards ${className}`}
            aria-label={ariaLabel}
        >
            {cards.map((card, index) => (
                <SummaryCard
                    key={card.key || index}
                    card={card}
                />
            ))}
        </section>
    );
}