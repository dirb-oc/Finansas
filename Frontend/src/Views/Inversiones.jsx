import { useEffect, useState } from "react";
import { getInversiones, getResumenInversiones } from "../controllers/inversionesController";
import formatCOP from "../Services/utils";
import "../Components/Inversiones.css";

import CreateInversion from "../Components/CreateInversion";
import FinalizarInversion from "../Components/FinalizarInversion";

export default function Inversiones() {
    const [inversiones, setInversiones] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [selectedInv, setSelectedInv] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const loadData = () => {
        getInversiones().then(setInversiones);
        getResumenInversiones().then(setResumen);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="General">
            <div className="header">
                <h2>Inversiones</h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    Nueva inversión
                </button>
            </div>

            <div className="inv-cards">
                <div className="inv-card patrimonio">
                    <span className="inv-card-label">Patrimonio</span>
                    <span className="inv-card-value">{formatCOP(resumen?.total || 0)}</span>
                </div>
                <div className="inv-card invertido">
                    <span className="inv-card-label">Inversion Actual</span>
                    <span className="inv-card-value">{formatCOP(resumen?.invertido || 0)}</span>
                </div>
                <div className="inv-card ganancia">
                    <span className="inv-card-label">Ganancia</span>
                    <span className="inv-card-value">{formatCOP(resumen?.ganancia_inversiones || 0)}</span>
                </div>
                <div className="inv-card rentabilidad">
                    <span className="inv-card-label">Rentabilidad</span>
                    <span className="inv-card-value">{resumen?.porcentaje || 0}%</span>
                </div>
            </div>

            {showModal && (
                <CreateInversion
                    onClose={() => setShowModal(false)}
                    onCreated={loadData}
                />
            )}

            <div className="inv-table-container">
                <table className="inv-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Cuenta</th>
                        </tr>
                    </thead>

                    <tbody>
                        {inversiones.map((inv) => (
                            <tr
                                key={inv.id}
                                onClick={() =>
                                    inv.estado === "activa" && setSelectedInv(inv)
                                }
                                style={{
                                    cursor:
                                        inv.estado === "activa"
                                            ? "pointer"
                                            : "default",
                                }}
                            >
                                <td className="inv-name">{inv.nombre}</td>

                                <td className="inv-type">{inv.tipo}</td>

                                <td className="inv-monto">
                                    {formatCOP(inv.monto_inicial)}
                                </td>

                                <td>
                                    <span className={`inv-status ${inv.estado}`}>
                                        {inv.estado === "activa"
                                            ? "Activa"
                                            : "Finalizada"}
                                    </span>
                                </td>

                                <td className="inv-cuenta">
                                    {inv.cuenta_nombre}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedInv && (
                <FinalizarInversion
                    inversion={selectedInv}
                    onClose={() => setSelectedInv(null)}
                    onDone={loadData}
                />
            )}
        </div>
    );
}