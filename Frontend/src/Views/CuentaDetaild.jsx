import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCuentaById } from "../controllers/cuentasController";
import CreateTransactionModal from "../Components/CreateTransactionModal";
import formatCOP from "../Services/utils";
import "../Components/CuentaDetail.css";

export default function CuentaDetail() {
    const { id } = useParams();
    const [cuenta, setCuenta] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).replace(/\./g, "");
    };

    useEffect(() => {
        getCuentaById(id).then(setCuenta);
    }, [id, refresh]);

    if (!cuenta) return <p className="loading">Cargando...</p>;

    return (
        <div className="General">
            <div className="header">
                <h1>{cuenta.nombre}</h1>
                <button
                    className="btn-primary"
                    onClick={() => setOpenModal(true)}
                >
                    Crear movimiento
                </button>
            </div>

            <CreateTransactionModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                cuentaId={id}
                onCreated={() => setRefresh(prev => !prev)}
            />

            {/* RESUMEN */}
            <div className="cuenta-stats">
                <div className="stat saldo">
                    <span>Saldo</span>
                    <h2>{formatCOP(cuenta.saldo)}</h2>
                </div>

                <div className="stat ingreso">
                    <span>Ingresos</span>
                    <h2>{formatCOP(cuenta.ingresos_total)}</h2>
                </div>

                <div className="stat gasto">
                    <span>Gastos</span>
                    <h2>{formatCOP(cuenta.gastos_total)}</h2>
                </div>
            </div>

            {/* TABLA */}
            <div className="table-container">
                <h2>Movimientos</h2>

                <table className="mov-table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th className="text-right">Monto</th>
                            <th className="text-right">Fecha</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cuenta.movimientos.map((mov) => (
                            <tr key={mov.id}>
                                <td>{mov.tipo_nombre}</td>

                                <td className={`monto ${mov.tipo_base} text-right`}>
                                    {formatCOP(mov.monto)}
                                </td>

                                <td className="text-right">{formatDate(mov.fecha)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}