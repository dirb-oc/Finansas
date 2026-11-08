import { getCardById, CreateCompra, EditCompra, CreatePago, EditPago} from "../controllers/cardController";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import CreditCardSummary from "../Components/CreditCard/CreditCardSummary";
import CreditCardPurchases from "../Components/CreditCard/CreditCardPurchases";
import CreditCardPayments from "../Components/CreditCard/CreditCardPayments";

import FormPagoCredito from "../Components/Forms/FormPagoCredito";
import FormCompra from "../Components/Forms/FormCompra";
import Modal from "../Components/Modal";

export default function CardDetaild() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tarjeta, setTarjeta] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openPago, setOpenPago] = useState(false);
    
    const refreshCard = () => { getCardById(id).then(setTarjeta); };
    
    useEffect(() => { refreshCard(); }, [id]);

    const [compraSeleccionada, setCompraSeleccionada] = useState(null);
    
    const handleCreateCompra = () => { setCompraSeleccionada(null); setOpenCreate(true); };
    const handleEditCompra = (compra) => { setCompraSeleccionada(compra); setOpenCreate(true); };
    const handleCloseCompra = () => { setOpenCreate(false); setCompraSeleccionada(null); };

    const handleSubmitCompra = async (data) => {
        if (compraSeleccionada) {
            await EditCompra(compraSeleccionada.id, data);
        } else {
            await CreateCompra(data);
        }
    };

    const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

    const handleCreatePago = () => { setPagoSeleccionado(null); setOpenPago(true); };
    const handleEditPago = (pago) => { setPagoSeleccionado(pago); setOpenPago(true); };
    const handleClosePago = () => { setOpenPago(false); setPagoSeleccionado(null); };

    const handleSubmitPago = async (data) => {
        if (pagoSeleccionado) {
            await EditPago( pagoSeleccionado.id, data );
        } else {
            await CreatePago(data);
        }
    };

    if (!tarjeta) { return <p className="loading">Cargando...</p>; }

    return (
        <div className="General">

            <h1 className="title" > Mi Tarjeta de Crédito </h1>

            <p className="subtitle card-detail__back" onClick={() => navigate(-1)} >
                <ArrowLeft size={18} />
                <span>Volver</span>
            </p>

            <div className="divisor" />

            <CreditCardSummary tarjeta={tarjeta} />

            <div className="credit-card-activity-grid">

                <CreditCardPurchases
                    compras={tarjeta.compras}
                    onCreate={handleCreateCompra}
                    onEditCompra={handleEditCompra}
                />

                <CreditCardPayments
                    compras={tarjeta.compras}
                    onCreta={handleCreatePago}
                    onEditPago={handleEditPago}
                />

            </div>

            <Modal isOpen={openCreate} onClose={handleCloseCompra} className="modal-Form" >
                <FormCompra
                    tarjeta={id}
                    compra={compraSeleccionada}
                    onSubmit={handleSubmitCompra}
                    onClose={handleCloseCompra}
                    onSuccess={() => {
                        refreshCard();
                        handleCloseCompra();
                    }}
                />
            </Modal>

            <Modal isOpen={openPago} onClose={handleClosePago} className="modal-Form" >
                <FormPagoCredito
                    pago={pagoSeleccionado}
                    onSubmit={handleSubmitPago}
                    onClose={handleClosePago}
                    onSuccess={() => {
                        refreshCard();
                        handleClosePago();
                    }}
                />
            </Modal>

        </div>
    );
}