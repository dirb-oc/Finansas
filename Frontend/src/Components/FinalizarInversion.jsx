import { useState } from "react";
import { finalizarInversion } from "../controllers/inversionesController";
import "./CreateInversion.css"; // reutilizamos estilos

export default function FinalizarInversion({ inversion, onClose, onDone }) {
    const [montoFinal, setMontoFinal] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await finalizarInversion(inversion.id, {
                monto_final: parseFloat(montoFinal),
            });

            onDone();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error al finalizar inversión");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">

                <h2>Finalizar inversión</h2>

                <p><strong>{inversion.nombre}</strong></p>
                <p>Monto inicial: {inversion.monto_inicial}</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="number"
                        placeholder="Monto final"
                        value={montoFinal}
                        onChange={(e) => setMontoFinal(e.target.value)}
                        required
                    />

                    <div className="modal-actions">
                        <button type="submit">Finalizar</button>
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}