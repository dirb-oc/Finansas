import formatCOP from "../../Services/utils";
import { CreditCard, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import "./CreditCard.css";


export default function CreditCards({ cards = [] }) {

    return (
        <div className="chart-card">

            <div className="chart-header">
                <h3>Tarjetas de Crédito</h3>
                <span>Tarjetas Activas: {cards.length}</span>
            </div>

            {cards.map((card) => (
                <CreditCardItem key={card.id} card={card} />
            ))}
        </div>
    );
}


function CreditCardItem({ card }) {

    const fechaPago = card.proximo_pago?.fecha;

    const textoPago = fechaPago
        ? `Vence ${new Date(`${fechaPago}T00:00:00`).toLocaleDateString(
            "es-CO",
            {
                day: "numeric",
                month: "short"
            }
        )}`
        : "Sin pagos pendientes";

    return (
        <Link to={`/tarjeta/${card.id}`}>

            <div className="credit-card">

                <div className="credit-card__header">

                    <div className="credit-card__icon"> <CreditCard /> </div>

                    <div className="credit-card__info">

                        <span className="credit-card__name">{card.nombre}</span>
                        <span className="credit-card__number">Crédito</span>
                    
                    </div>

                    <div className="credit-card__debt">

                        <strong>{formatCOP(card.deuda)}</strong>
                        <span>de {formatCOP(card.cupo)}</span>
                    
                    </div>

                </div>

                <div className="credit-card__usage">

                    <div className="credit-card__usage-header">
                        <span>Crédito utilizado</span>
                        <strong>{card.porcentaje}%</strong>
                    </div>

                    <div className="credit-card__progress">
                        <div
                            className="credit-card__progress-value"
                            style={{ width: `${Math.min(card.porcentaje, 100)}%` }}
                        />
                    </div>

                </div>

                <div className="credit-card__footer">

                    <div className="credit-card__payment">
                        <CalendarDays size={18} />
                        <span>{textoPago}</span>
                    </div>

                    <div className="credit-card__payment-amount">
                        <span>Pago {formatCOP(card.proximo_pago?.monto ?? 0)}</span>
                    </div>

                </div>

            </div>

        </Link>
    );
}