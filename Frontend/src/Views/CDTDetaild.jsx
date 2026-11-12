import { Wallet, Layers, CreditCard, Calendar, } from "lucide-react";
import { getCDTs } from "../controllers/investmentsController";
import { useEffect, useState } from "react";

import FormFinalizarCDT from "../Components/Forms/FormFinalizarCDT";
import formatCOP, { formatExpiration } from "../Services/utils";
import SummaryCards from "../Components/SummaryCards";
import CDTActivos from "../Components/CDT/CDTActivos";
import FormCDT from "../Components/Forms/FormCDT";
import CDTList from "../Components/CDT/CDTList";
import Modal from "../Components/Modal"
import BackFooter from "../Components/BackFooter";

export default function CDTDetaild() {

    const [stats, setStats] = useState(null);

    const [openCreate, setOpenCreate] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        getCDTs().then(setStats);
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

    useEffect(() => { getCDTs().then(setStats); }, []);

    if (!stats) return <p className="loading">Cargando...</p>;

    const cards = [
        {
            key: "disponible",
            title: "CDT Activos",
            icon: <Wallet size={20} />,
            value: stats.estadisticas.cantidad,
        },
        {
            key: "invertido",
            title: "Capital",
            icon: <Layers size={20} />,
            value: formatCOP(stats.estadisticas.capital),
        },
        {
            key: "ganancia",
            title: "Rendimientos Totales",
            icon: <CreditCard size={20} />,
            value: formatCOP(stats.estadisticas.ganancias),
        },
        {
            key: "rentabilidad",
            title: "Próximo Vencimiento",
            icon: <Calendar size={20} />,
            value: formatExpiration(stats.estadisticas.proximo_vencimiento),
        },
    ];

    return (
        <div className="General">
            <h1 className="title">Mis CDT</h1>
            <p className="subtitle">Seguimiento de las inversiones en renta fija</p>

            <div className="divisor" />

            <SummaryCards
                cards={cards}
                ariaLabel="Resumen CDTs"
            />

            <CDTActivos
                cdts={stats.activos}
                onCreate={() => setOpenCreate(true)}
                onFinalizar={handleFinalizar}
            />

            <CDTList cdts={stats.finalizados} />

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
            <BackFooter />
        </div>
    );
}