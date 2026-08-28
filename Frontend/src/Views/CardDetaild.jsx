import { useEffect, useState } from "react";
import { getCardById } from "../controllers/cardController";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import CreditCardSummary from "../Components/CreditCard/CreditCardSummary"
import CreditCardPurchases from "../Components/CreditCard/CreditCardPurchases"
import CreditCardPayments from "../Components/CreditCard/CreditCardPayments"
import FormAddCompra from "../Components/Forms/FormAddCompra"
import FormAddPagoCredito from "../Components/Forms/FormAddPagoCredito"
import Modal from "../Components/Modal"

export default function CardDetaild() {
    const { id } = useParams();
    const [tarjeta, setTarjeta] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openPago, setOpenPago] = useState(false);
    const navigate = useNavigate();

    const refreshCard = () => { getCardById(id).then(setTarjeta); };

    useEffect(() => { refreshCard(); }, [id]);

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
                    onCreta={() => setOpenCreate(true)}
                />

                <CreditCardPayments
                    compras={tarjeta.compras}
                    onCreta={() => setOpenPago(true)}
                />

            </div>

            <Modal isOpen={openCreate} onClose={() => setOpenCreate(false)} className={"modal-FormGame"}>
                <FormAddCompra
                    tarjeta={id}
                    onClose={() => setOpenCreate(false)}
                    onSuccess={() => { refreshCard(); setOpenCreate(false); }}
                />
            </Modal>

            <Modal isOpen={openPago} onClose={() => setOpenPago(false)} className={"modal-FormGame"}>
                <FormAddPagoCredito
                    onClose={() => setOpenPago(false)}
                    onSuccess={() => { refreshCard(); setOpenPago(false); }}
                />
            </Modal>

        </div>
    );
}