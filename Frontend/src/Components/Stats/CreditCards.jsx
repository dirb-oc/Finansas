import formatCOP from "../../Services/utils";
import { CreditCard, CalendarDays } from "lucide-react";
import "./CreditCard.css";

export default function CreditCards({ cards }) {

    return (
        <div className="chart-card">

            <div className="chart-header">
                <h3>Tarjetas de Creditos</h3>
                <span>Tarjetas Activas: {cards.length}</span>
            </div>

            {cards.map((card) => (
                <div className="credit-card" key={card.id}>

                    <div className="credit-card__header">

                        <div className="credit-card__icon">
                            <CreditCard />
                        </div>

                        <div className="credit-card__info">
                            <span className="credit-card__name">
                                {card.nombre}
                            </span>

                            <span className="credit-card__number">
                                Crédito
                            </span>
                        </div>

                        <div className="credit-card__debt">
                            <strong>
                                {formatCOP(card.deuda)}
                            </strong>
                            <span>
                                de {formatCOP(card.cupo)}
                            </span>
                        </div>

                    </div>

                    {/* Utilización */}
                    <div className="credit-card__usage">

                        <div className="credit-card__usage-header">
                            <span>Crédito utilizado</span>
                            <strong>{card.porcentaje}%</strong>
                        </div>

                        <div className="credit-card__progress">
                            <div
                                className="credit-card__progress-value"
                                style={{
                                    width: `${Math.min(card.porcentaje, 100)}%`
                                }}
                            />
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="credit-card__footer">

                        <div className="credit-card__payment">
                            <CalendarDays size={18} />

                            <div>
                                <span>Vence

                                    {card.proximo_pago?.fecha
                                        ? new Date(
                                            `${card.proximo_pago.fecha}T00:00:00`
                                        ).toLocaleDateString(
                                            "es-CO",
                                            {
                                                day: "numeric",
                                                month: "short"
                                            }
                                        )
                                        : "Sin pagos"
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="credit-card__payment-amount">
                            <span>
                                Pago {formatCOP(card.proximo_pago?.monto ?? 0)}
                            </span>
                        </div>

                    </div>

                </div>
            ))}

        </div>
    );
}