import { CreditCard, CalendarDays, WalletCards, CircleDollarSign } from "lucide-react";
import formatCOP from "../../Services/utils";
import "./CreditCardSummary.css";

export default function CreditCardSummary({ tarjeta }) {

    if (!tarjeta) return null;

    const formatDate = (date) => {
        if (!date) return "--";

        const [year, month, day] = date.split("-").map(Number);

        const localDate = new Date(year, month - 1, day);

        return localDate.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "short",
        });
    };

    const proximoPago = tarjeta.ciclo_actual;
    
    const getCycleStatus = (dias) => {

        if (dias === 0) {
            return "El ciclo finaliza hoy";
        }

        if (dias === 1) {
            return "Termina mañana";
        }

        return `Quedan ${dias} días`;
    };

    return (
        <section className="credit-card-summary">

            {/* INFORMACIÓN GENERAL */}
            <div className="credit-card-summary__main">

                <div className="credit-card-summary__identity">

                    <div className="credit-card-summary__icon">
                        <CreditCard size={24} />
                    </div>

                    <div>
                        <span className="credit-card-summary__label">
                            Tarjeta de crédito
                        </span>

                        <h2>{tarjeta.nombre}</h2>
                    </div>

                </div>

                <div className="credit-card-summary__stats">

                    <div className="credit-card-summary__stat">
                        <span>Deuda actual</span>
                        <strong className="debt">
                            {formatCOP(tarjeta.deuda_actual)}
                        </strong>
                    </div>

                    <div className="credit-card-summary__stat">
                        <span>Cupo disponible</span>
                        <strong>
                            {formatCOP(tarjeta.cupo_disponible)}
                        </strong>
                    </div>

                    <div className="credit-card-summary__stat">
                        <span>Cupo total</span>
                        <strong>
                            {formatCOP(tarjeta.cupo_total)}
                        </strong>
                    </div>

                </div>

                <div className="credit-card-summary__usage">

                    <div className="usage-header">
                        <span>Utilización del cupo</span>

                        <strong>
                            {tarjeta.porcentaje_utilizado}%
                        </strong>
                    </div>

                    <div className="usageCard-bar">
                        <div
                            className="usageCard-bar__fill"
                            style={{ width: `${Math.min(tarjeta.porcentaje_utilizado)}%` }}
                        />
                    </div>

                </div>

            </div>


            {/* CICLO Y TIEMPOS */}
            <div className="credit-card-summary__timeline">

                <div className="timeline-header">

                    <div>
                        <span className="credit-card-summary__label">
                            Ciclo actual
                        </span>

                        <strong>
                            {getCycleStatus(
                                tarjeta.ciclo_actual?.dias_restantes
                            )}
                        </strong>
                    </div>

                    <CalendarDays size={20} />

                </div>


                <div className="timeline">

                    <div className="timeline-point">

                        <span className="timeline-date">
                            {formatDate(proximoPago?.inicio)}
                        </span>

                        <span>Inicio</span>

                    </div>

                    <div className="timeline-line">
                        <span />
                    </div>

                    <div className="timeline-point timeline-point--end">

                        <span className="timeline-date">
                            {formatDate(proximoPago?.fin)}
                        </span>

                        <span>Corte</span>

                    </div>

                </div>


                <div className="credit-card-summary__payment">

                    <div className="payment-item">

                        <WalletCards size={18} />

                        <div>
                            <span>Fecha de pago</span>

                            <strong>
                                {formatDate(tarjeta?.proximo.fecha)}
                            </strong>
                        </div>

                    </div>


                    <div className="payment-item">

                        <CircleDollarSign size={18} />

                        <div>
                            <span>Próximo pago</span>

                            <strong>
                                {formatCOP(tarjeta?.proximo.monto)}
                            </strong>
                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}
