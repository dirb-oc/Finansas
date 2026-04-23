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

    useEffect(() => {
        getCuentaById(id).then(setCuenta);
    }, [id, refresh]);

    if (!cuenta) return <p className="loading">Cargando...</p>;

    return (
        <div className="General">
            <div className="cuenta-header">
                <h1>{cuenta.nombre}</h1>
                <button
                    className="btn-primary"
                    onClick={() => setOpenModal(true)}
                >
                    + Crear movimiento
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
                            <th></th>
                            <th>Monto</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cuenta.movimientos.map((mov) => (
                            <tr key={mov.id}>
                                <td>{mov.tipo_nombre}</td>

                                <td>
                                    <span className={`badge ${mov.tipo_base}`}>
                                        {mov.tipo_base === "ingreso" && "🟢"}
                                        {mov.tipo_base === "gasto" && "🔴"}
                                        {mov.tipo_base === "inicial" && "🔵"}
                                    </span>
                                </td>

                                <td className={`monto ${mov.tipo_base}`}>
                                    {formatCOP(mov.monto)}
                                </td>

                                <td>{mov.fecha}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}