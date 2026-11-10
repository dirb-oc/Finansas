import { Wallet, Layers, CreditCard, TrendingUp, } from "lucide-react";
import { getassets } from "../controllers/investmentsController";
import { useEffect, useState } from "react";

import FormFinalizarCDT from "../Components/Forms/FormFinalizarCDT";
import { formatMoney } from "../Services/utils";
import SummaryCards from "../Components/SummaryCards";
import FormCDT from "../Components/Forms/FormCDT";
import Modal from "../Components/Modal"

export default function AssetsDetaild() {

    const [stats, setStats] = useState(null);

    const [openCreate, setOpenCreate] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        getassets().then(setStats);
    }, [refresh]);

    const handleCloseModal = () => setOpenCreate(false);

    const handleRefresh = () => {
        setRefresh(prev => prev + 1);
    };

    const [cdtSeleccionado, setCdtSeleccionado] = useState(null);

    const handleFinalizar = (cdt) => {
        setCdtSeleccionado(cdt);
    };

    const handleCloseFinalizar = () => {
        setCdtSeleccionado(null);
    };

    const handleSuccessFinalizar = () => {
        setCdtSeleccionado(null);
        setRefresh(prev => prev + 1);
    };

    useEffect(() => { getassets().then(setStats); }, []);

    if (!stats) return <p className="loading">Cargando...</p>;

    const cards = [
        {
            key: "disponible",
            title: "Capital Invertido",
            icon: <Wallet size={20} />,
            value: formatMoney(
                stats.resumen.capital_invertido,
                stats.resumen.moneda
            ),
        },
        {
            key: "invertido",
            title: "Valor Actual",
            icon: <Layers size={20} />,
            value: formatMoney(
                stats.resumen.valor_actual,
                stats.resumen.moneda
            ),
        },
        {
            key: "ganancia",
            title: "Ganancia Total",
            icon: <CreditCard size={20} />,
            value: formatMoney(
                stats.resumen.ganancia,
                stats.resumen.moneda
            ),
        },
        {
            key: "rentabilidad",
            title: "Rentabilidad",
            icon: <TrendingUp size={20} />,
            value: `${stats.resumen.rendimiento?.toFixed(2) ?? "0.00"}%`,
        },
    ];

    return (
        <div className="General">
            <h1 className="title">Mis Activos</h1>
            <p className="subtitle">Seguimiento de las inversiones en renta variable</p>

            <div className="divisor" />

            <SummaryCards
                cards={cards}
                ariaLabel="Resumen CDTs"
            />

            <Modal
                isOpen={openCreate}
                onClose={handleCloseModal}
                className="modal-Form"
            >
                <FormCDT
                    onClose={handleCloseModal}
                    onSuccess={() => {
                        handleRefresh();
                        handleCloseModal();
                    }}
                />
            </Modal>

            <Modal
                isOpen={!!cdtSeleccionado}
                onClose={handleCloseFinalizar}
                className="modal-FormGame"
            >
                {cdtSeleccionado && (
                    <FormFinalizarCDT
                        cdt={cdtSeleccionado}
                        onClose={handleCloseFinalizar}
                        onSuccess={handleSuccessFinalizar}
                    />
                )}
            </Modal>
        </div>
    );
}