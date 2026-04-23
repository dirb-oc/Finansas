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

    // cargar tipos desde controller
    useEffect(() => { if (!open) return; getTipos().then(setTipos); }, [open]);

    // filtrar según ingreso/gasto
    const tiposFiltrados = tipos.filter(t => t.tipo === tipo);

    // ESC
    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && onClose();
        if (open) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!tipoId || !monto) return;

        await createMovimiento({
            cuenta: cuentaId,   // 🔥 clave
            tipo: tipoId,
            descripcion,
            monto: parseFloat(monto)
        });

        onCreated && onCreated(); // refrescar lista
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header"><h2>Add Transaction</h2></div>

                <p className="subtitle">Record a new income or expense</p>

                <div className="toggle">
                    <button
                        className={tipo === "ingreso" ? "active ingreso" : ""}
                        onClick={() => {
                            setTipo("ingreso");
                            setTipoId("");
                        }}
                    >
                        ↑ Income
                    </button>

                    <button
                        className={tipo === "gasto" ? "active gasto" : ""}
                        onClick={() => {
                            setTipo("gasto");
                            setTipoId("");
                        }}
                    >
                        ↓ Expense
                    </button>
                </div>

                <label>Description</label>
                <input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />

                {/* select dinamico */}
                <label>Category</label>
                <select
                    value={tipoId}
                    onChange={(e) => setTipoId(e.target.value)}
                >
                    <option value="">Select</option>
                    {tiposFiltrados.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.nombre}
                        </option>
                    ))}
                </select>

                {/* monto */}
                <label>Amount</label>
                <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                />

                <div className="actions">
                    <button className="submit" onClick={handleSubmit}>
                        Add {tipo === "ingreso" ? "Income" : "Expense"}
                    </button>
                </div>

            </div>
        </div>
    );
}