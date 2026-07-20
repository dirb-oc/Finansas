import { useEffect, useState } from "react";
import { getTipos } from "../controllers/tiposController";
import { updateMovimiento } from "../controllers/movimientosController";
import CustomSelect from "./CustomSelect";
import "./CreateTransactionModal.css";

export default function EditTransactionModal({ open, onClose, movimiento, onUpdated }) {
    const [tipo, setTipo] = useState("");
    const [tipos, setTipos] = useState([]);
    const [descripcion, setDescripcion] = useState("");
    const [tipoId, setTipoId] = useState("");
    const [monto, setMonto] = useState("");

    useEffect(() => {
        if (!open) return;
        getTipos().then(setTipos);
    }, [open]);

    useEffect(() => {
        if (!open || !movimiento) return;

        setTipo(movimiento.tipo_base);
        setTipoId(movimiento.tipo);
        setDescripcion(movimiento.descripcion || "");

        // guardar solo números
        setMonto(String(parseInt(movimiento.monto)));
    }, [open, movimiento]);

    useEffect(() => {
        if (!open) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    const tiposFiltrados = tipos.filter(t => t.tipo === tipo);

    if (!open || !movimiento) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatCOP = (value) => {
        if (!value) return "";

        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = async () => {
        if (!tipoId || !monto) return;

        await updateMovimiento(movimiento.id, {
            cuenta: movimiento.cuenta,
            tipo: tipoId,
            descripcion,
            monto: parseFloat(monto)
        });

        onUpdated && onUpdated();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Movimiento</h2>
                </div>

                <p className="subtitle">Modificar movimiento</p>

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
                <CustomSelect
                    value={String(tipoId || "")}
                    onChange={setTipoId}
                    options={tiposFiltrados}
                />

                <label>Monto</label>
                <input
                    type="text"
                    value={formatCOP(monto)}
                    onChange={(e) => {
                        // solo números
                        const rawValue = e.target.value.replace(/\D/g, "");
                        setMonto(rawValue);
                    }}
                    placeholder="$ 0"
                />

                <div className="actions">
                    <button className="submit" onClick={handleSubmit}>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}