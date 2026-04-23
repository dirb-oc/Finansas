import { useEffect, useState } from "react";
import { getInversiones } from "../controllers/inversionesController";
import formatCOP from "../Services/utils";
import "../Components/Inversiones.css";

import CreateInversion from "../Components/CreateInversion";
import FinalizarInversion from "../Components/FinalizarInversion";


export default function Inversiones() {
  const [inversiones, setInversiones] = useState([]);
  const [selectedInv, setSelectedInv] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const loadData = () => {
    getInversiones().then(setInversiones);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    getInversiones().then(setInversiones);
  }, []);

  return (
    <div className="General">
      <h1 className="inv-title">Inversiones</h1>
      <button onClick={() => setShowModal(true)}>
        + Nueva inversión
      </button>
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
              <tr key={inv.id}
                onClick={() => inv.estado === "activa" && setSelectedInv(inv)}
                style={{ cursor: inv.estado === "activa" ? "pointer" : "default" }}>
                <td className="inv-name">{inv.nombre}</td>

                <td className="inv-type">{inv.tipo}</td>

                <td className="inv-monto">
                  {formatCOP(inv.monto_inicial)}
                </td>

                <td>
                  <span className={`inv-status ${inv.estado}`}>
                    {inv.estado === "activa" ? "Activa" : "Finalizada"}
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