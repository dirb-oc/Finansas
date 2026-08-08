import { getCuentaById } from "../controllers/cuentasController";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CreateTransactionModal from "../Components/CreateTransactionModal";
import EditTransactionModal from "../Components/EditTransactionModal";
import Transactions from "../Components/Accounts/Transactions";
import Totals from "../Components/Accounts/Totals";

export default function AccountDetail() {
    const { id } = useParams();
    const [cuenta, setCuenta] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const handleEditMovimiento = (movimiento) => {
        setSelectedMovimiento(movimiento);
        setOpenEditModal(true);
    };
    useEffect(() => {
        getCuentaById(id).then(setCuenta);
    }, [id, refresh]);

    if (!cuenta) return <p className="loading">Cargando...</p>;

    return (
        <div className="General">
            <div className="header">
                <Link to={"/"}><h1>{cuenta.nombre}</h1></Link>
                <button className="btn-primary" onClick={() => setOpenModal(true)} >
                    Crear movimiento
                </button>
            </div>

            <CreateTransactionModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                cuentaId={id}
                onCreated={() => setRefresh(prev => !prev)}
            />

            <EditTransactionModal
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                movimiento={selectedMovimiento}
                onUpdated={() => setRefresh(prev => !prev)}
            />

            <div className="gridAccount">
                <Totals cuenta={cuenta} />
                <Transactions
                    cuenta={cuenta}
                    onEditMovimiento={handleEditMovimiento}
                />
            </div>
        </div>
    );
}