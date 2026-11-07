import { Wallet, Layers, CreditCard, Calendar, } from "lucide-react";
import { getCDTs } from "../controllers/investmentsController";
import { useEffect, useState } from "react";

import formatCOP, {formatExpiration} from "../Services/utils";
import SummaryCards from "../Components/SummaryCards";
import CDTList from "../Components/CDT/CDTList";
import CDTActivos from "../Components/CDT/CDTActivos";

export default function CDTDetaild() {

    const [stats, setStats] = useState(null);


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
            key: "income",
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
            <p className="subtitle">Seguimiento de mis inversiones de renta fija</p>

            <div className="divisor" />

            <SummaryCards
                cards={cards}
                ariaLabel="Resumen CDTs"
            />

            <CDTActivos cdts={stats.activos} />
            <CDTList cdts={stats.finalizados} />

        </div>
    );
}