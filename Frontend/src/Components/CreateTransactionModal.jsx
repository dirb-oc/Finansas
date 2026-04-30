import { useEffect, useState } from "react";
import { getTipos } from "../controllers/tiposController";
import { createMovimiento } from "../controllers/movimientosController";
import "./CreateTransactionModal.css";

export default function CreateTransactionModal({ open, onClose, cuentaId, onCreated }) {
    const [tipo, setTipo] = useState("ingreso");
    const [tipos, setTipos] = useState([]);

    const [descripcion, setDescripcion] = useState("");
    const [tipoId, setTipoId] = useState("");
    const [monto, setMonto] = useState("");

    useEffect(() => {
        if (!open) return;
        getTipos().then(setTipos);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    const tiposFiltrados = tipos.filter(t => t.tipo === tipo);

    if (!open) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!tipoId || !monto) return;

        await createMovimiento({
            cuenta: cuentaId,
            tipo: tipoId,
            descripcion,
            monto: parseFloat(monto.replace(/[$,.]/g, ""))
        });

        onCreated && onCreated();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nuevo Movimiento</h2>
                </div>

                <p className="subtitle">Registrar un nuevo ingreso o gasto</p>

                <div className="toggle">
                    <button
                        className={tipo === "ingreso" ? "active ingreso" : ""}
                        onClick={() => {
                            setTipo("ingreso");
                            setTipoId("");
                        }}
                    >
                        ↑ Ingreso
                    </button>

                    <button
                        className={tipo === "gasto" ? "active gasto" : ""}
                        onClick={() => {
                            setTipo("gasto");
                            setTipoId("");
                        }}
                    >
                        ↓ Gasto
                    </button>
                </div>

                <label>Descripción</label>
                <input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción"
                />

                <label>Categoría</label>
                <select
                    value={tipoId}
                    onChange={(e) => setTipoId(e.target.value)}
                >
                    <option value="">Seleccionar</option>
                    {tiposFiltrados.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.nombre}
                        </option>
                    ))}
                </select>

                <label>Monto</label>
                <input
                    type="text"
                    value={monto}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setMonto(val);
                    }}
                    onBlur={(e) => {
                        const num = parseFloat(e.target.value.replace(/[^\d]/g, ""));
                        if (num) {
                            setMonto(num.toString());
                        }
                    }}
                    placeholder="0"
                />

                <div className="actions">
                    <button className="cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="submit" onClick={handleSubmit}>
                        Agregar {tipo === "ingreso" ? "Ingreso" : "Gasto"}
                    </button>
                </div>
            </div>
        </div>
    );
}