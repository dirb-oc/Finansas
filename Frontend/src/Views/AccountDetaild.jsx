import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCuentaById } from "../controllers/AccountController";

import Modal from "../Components/Modal";
import Totals from "../Components/Accounts/Totals";
import FormMovimiento from "../Components/Forms/FormMovimiento";
import ActivityAccount from "../Components/Accounts/ActivityAccount";

export default function AccountDetaild() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [cuenta, setCuenta] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [openCreate, setOpenCreate] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

    useEffect(() => { getCuentaById(id).then(setCuenta); }, [id, refresh]);

    const handleRefresh = () => { setRefresh(prev => prev + 1); };
    const handleCreateMovimiento = () => { setMovimientoSeleccionado(null); setOpenCreate(true); };
    const handleEditMovimiento = (movimiento) => { setMovimientoSeleccionado(movimiento); setOpenCreate(true); };
    const handleCloseModal = () => { setOpenCreate(false); setMovimientoSeleccionado(null); };

    if (!cuenta) { return <p className="loading">Cargando...</p>; }

    return (
        <div className="General account-detail">

            <h1 className="title">Mi Cuenta</h1>

            <p className="subtitle card-detail__back" onClick={() => navigate(-1)} >
                <ArrowLeft size={18} />
                <span>Volver</span>
            </p>

            <div className="divisor" />

            <Totals cuenta={cuenta} />
            
            <ActivityAccount
                cuenta={cuenta}
                onEditMovimiento={handleEditMovimiento}
                onCreateMovimiento={handleCreateMovimiento}
            />

            <Modal isOpen={openCreate} onClose={handleCloseModal} className="modal-FormGame" >

                <FormMovimiento
                    cuenta={id}
                    movimiento={movimientoSeleccionado}
                    onClose={handleCloseModal}
                    onSuccess={() => {
                        handleRefresh();
                        handleCloseModal();
                    }}
                />

            </Modal>

        </div>
    );
}