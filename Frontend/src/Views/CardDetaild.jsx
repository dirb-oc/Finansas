import { useEffect, useState } from "react";
import { getCardById } from "../controllers/cardController";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import CreditCardSummary from "../Components/CreditCard/CreditCardSummary"
import CreditCardPurchases from "../Components/CreditCard/CreditCardPurchases"
import CreditCardPayments from "../Components/CreditCard/CreditCardPayments"

export default function CardDetaild() {
    const { id } = useParams();
    const [tarjeta, setTarjeta] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getCardById(id).then(setTarjeta);
    }, [id]);

    if (!tarjeta) {
        return <p className="loading">Cargando...</p>;
    }

    return (
        <div className="General">

            <h1 className="title">Mi Tarjeta de Credito</h1>
            <p className="subtitle card-detail__back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                <span>Volver</span>
            </p>

            <div className="divisor" />

            <CreditCardSummary tarjeta={tarjeta} />

            <div className="credit-card-activity-grid">

                <CreditCardPurchases
                    compras={tarjeta.compras}
                // onSelectCompra={handleSelectCompra}
                />

                <CreditCardPayments
                    compras={tarjeta.compras}
                />

            </div>


        </div>
    );
}