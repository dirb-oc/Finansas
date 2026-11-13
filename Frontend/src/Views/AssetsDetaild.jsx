import { Wallet, Layers, CreditCard, TrendingUp, } from "lucide-react";
import { getassets } from "../controllers/investmentsController";
import { formatMoney } from "../Services/utils";
import { useEffect, useState } from "react";

import FormMovimientoBroker from "../Components/Forms/FormMovimientoBroker";
import FormOperacionActivo from "../Components/Forms/FormOperacionActivo";
import FormPrecioActivo from "../Components/Forms/FormPrecioActivo";
import FormCotizacion from "../Components/Forms/FormCotizacion";

import BrokerSection from "../Components/Ass/BrokerSection";
import SummaryCards from "../Components/SummaryCards";
import BackFooter from "../Components/BackFooter"
import Activos from "../Components/Ass/Activos";
import Modal from "../Components/Modal"

export default function AssetsDetaild() {

    const [stats, setStats] = useState(null);

    const [openOperacion, setOpenOperacion] = useState(false);
    const [openMovimiento, setOpenMovimiento] = useState(false);
    const [openCotizacion, setOpenCotizacion] = useState(false);
    const [activoSeleccionado, setActivoSeleccionado] = useState(null);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        getassets().then(setStats);
    }, [refresh]);


    const handleCloseCotizacion = () => setOpenCotizacion(false);

    const handleRefresh = () => {
        setRefresh(prev => prev + 1);
    };


    const handleClosePrecio = () => {
        setActivoSeleccionado(null);
    };

    const handleSuccessPrecio = () => {
        setActivoSeleccionado(null);
        handleRefresh();
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

            <Activos
                activos={stats.activos}
                onCreate={(activo) => setActivoSeleccionado(activo)}
            />

            <BrokerSection
                brokers={stats.brokers}
                historial={stats.historial}
                onCreateOperacion={() => setOpenOperacion(true)}
                onCreateMovimiento={() => setOpenMovimiento(true)}
                onCotizacion={() => setOpenCotizacion(true)}
            />

            <BackFooter />

            <Modal
                isOpen={openCotizacion}
                onClose={handleCloseCotizacion}
                className="modal-Form"
            >
                <FormCotizacion
                    broker={stats.brokers?.[0]}
                    onSuccess={() => {
                        handleRefresh();
                        handleCloseCotizacion();
                    }}
                    onClose={handleCloseCotizacion}
                />
            </Modal>

            <Modal
                isOpen={!!activoSeleccionado}
                onClose={handleClosePrecio}
                className="modal-Form"
            >
                {activoSeleccionado && (
                    <FormPrecioActivo
                        activo={activoSeleccionado}
                        onSuccess={handleSuccessPrecio}
                        onClose={handleClosePrecio}
                    />
                )}
            </Modal>

            <Modal
                isOpen={openMovimiento}
                onClose={() => setOpenMovimiento(false)}
                className="modal-Form"
            >
                <FormMovimientoBroker
                    broker={stats.brokers?.[0]}
                    onSuccess={() => {
                        handleRefresh();
                        setOpenMovimiento(false);
                    }}
                    onClose={() => setOpenMovimiento(false)}
                />
            </Modal>

            <Modal
                isOpen={openOperacion}
                onClose={() => setOpenOperacion(false)}
                className="modal-Form"
            >
                <FormOperacionActivo
                    broker={stats.brokers?.[0]}
                    onSuccess={() => {
                        handleRefresh();
                        setOpenOperacion(false);
                    }}
                    onClose={() => setOpenOperacion(false)}
                />
            </Modal>
        </div>
    );
}