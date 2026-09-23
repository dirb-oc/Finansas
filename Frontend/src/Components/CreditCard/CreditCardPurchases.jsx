import formatCOP, { formatDate } from "../../Services/utils";
import { ShoppingCart } from "lucide-react";
import "./CreditCardActivity.css";

export default function CreditCardPurchases({compras = [],onCreate, onEditCompra}) {

    const getEstado = (estado) => {
        switch (estado) {
            case "pendiente": return "Pendiente";
            case "pagando": return "Pagando";
            case "saldada": return "Saldada";

            default: return estado;
        }
    };

    return (
        <section className="credit-card-activity">

            <div className="credit-card-activity__header">

                <div>
                    <span className="credit-card-activity__label">Actividad</span>
                    <h3>Compras</h3>
                </div>

                <ShoppingCart onClick={onCreate} size={20} />

            </div>


            <div className="credit-card-activity__list">

                {compras.length === 0 ? (

                    <div className="credit-card-activity__empty">
                        <ShoppingCart size={22} />
                        <span>No hay compras</span>
                    </div>

                ) : (

                    compras.map((compra) => (

                        <div key={compra.id} className="purchase-item" onClick={() => onEditCompra?.(compra)} >

                            <div className="purchase-item__icon"><ShoppingCart size={18} /></div>

                            <div className="purchase-item__info">

                                <strong>{compra.descripcion}</strong>
                                <span>{formatDate(compra.fecha_compra)}</span>

                            </div>


                            <div className="purchase-item__details">

                                <strong>{formatCOP(compra.monto)}</strong>

                                <span>
                                    {compra.numero_cuotas > 1
                                        ? `${compra.numero_cuotas} cuotas`
                                        : "1 cuota"}
                                </span>

                            </div>


                            <div className={`purchase-item__status ${compra.estado}`} >
                                {getEstado(compra.estado)}
                            </div>

                        </div>

                    ))

                )}

            </div>

        </section>
    );
}