import { useState, useEffect } from "react";
import { finalizarInversion } from "../controllers/inversionesController";
import formatCOP from "../Services/utils";
import "./CreateInversion.css";

export default function FinalizarInversion({ inversion, onClose, onDone }) {
    const [montoFinal, setMontoFinal] = useState("");

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await finalizarInversion(inversion.id, {
                monto_final: parseFloat(montoFinal.replace(/[$,.]/g, "")),
            });

            onDone();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error al finalizar inversión");
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Finalizar inversión</h2>

                <div className="inversion-info">
                    <p className="inv-name">{inversion.nombre}</p>
                    <p className="inv-monto">Monto inicial: <span>{formatCOP(inversion.monto_inicial)}</span></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>Monto final</label>
                    <input
                        type="text"
                        placeholder="0"
                        value={montoFinal}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setMontoFinal(val);
                        }}
                        onBlur={(e) => {
                            const num = parseFloat(e.target.value.replace(/[^\d]/g, ""));
                            if (num) {
                                setMontoFinal(num.toString());
                            }
                        }}
                        required
                    />

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            Finalizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}