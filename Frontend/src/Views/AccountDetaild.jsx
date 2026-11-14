import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCuentaById } from "../controllers/AccountController";

import ActivityAccount from "../Components/Accounts/ActivityAccount";
import FormMovimiento from "../Components/Forms/FormMovimiento";
import Totals from "../Components/Accounts/Totals";
import Modal from "../Components/Modal";
import BackFooter from "../Components/BackFooter"

export default function AccountDetaild() {

    const { id } = useParams();

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
            <p className="subtitle">Consulta tu saldo, movimientos y actividad financiera.</p>

            <div className="divisor" />

            <Totals cuenta={cuenta} />

            <div className="heading">
                <div>
                    <h2>Actividad de la cuenta</h2>
                    <p>Consulta tus movimientos y revisa cómo han evolucionado tus ingresos y gastos.</p>
                </div>
            </div>

            <ActivityAccount
                cuenta={cuenta}
                onEditMovimiento={handleEditMovimiento}
                onCreateMovimiento={handleCreateMovimiento}
            />

            <BackFooter />

            <Modal isOpen={openCreate} onClose={handleCloseModal} className="modal-Form" >

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