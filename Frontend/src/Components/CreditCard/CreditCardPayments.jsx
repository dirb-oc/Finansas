import {
    CircleCheck,
    WalletCards
} from "lucide-react";

import formatCOP from "../../Services/utils";
import "./CreditCardActivity.css";

export default function CreditCardPayments({
    compras = []
}) {

    const formatDate = (date) => {
        if (!date) return "--";

        return new Date(date).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
        });
    };

    /*
     * Los pagos están dentro de cada compra.
     * Los convertimos en una sola lista.
     */
    const pagos = compras
        .flatMap((compra) =>
            (compra.pagos || []).map((pago) => ({
                ...pago,
                compra_descripcion: compra.descripcion,
            }))
        )
        .sort(
            (a, b) =>
                new Date(b.fecha) - new Date(a.fecha)
        );


    return (
        <section className="credit-card-activity">

            <div className="credit-card-activity__header">

                <div>
                    <span className="credit-card-activity__label">
                        Actividad
                    </span>

                    <h3>
                        Pagos
                    </h3>
                </div>

                <WalletCards size={20} />

            </div>


            <div className="credit-card-activity__list">

                {pagos.length === 0 ? (

                    <div className="credit-card-activity__empty">

                        <WalletCards size={22} />

                        <span>
                            No hay pagos registrados
                        </span>

                    </div>

                ) : (

                    pagos.map((pago) => (

                        <div
                            key={pago.id}
                            className="payment-item-row"
                        >

                            <div className="payment-item-row__icon">
                                <CircleCheck size={18} />
                            </div>


                            <div className="payment-item-row__info">

                                <strong>
                                    {pago.compra_descripcion}
                                </strong>

                                <span>
                                    {formatDate(pago.fecha)}
                                </span>

                            </div>


                            <div className="payment-item-row__amount">
                                -{formatCOP(pago.monto)}
                            </div>

                        </div>

                    ))

                )}

            </div>

        </section>
    );
}