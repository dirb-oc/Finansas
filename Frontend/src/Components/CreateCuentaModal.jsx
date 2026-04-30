import { useState, useEffect } from "react";
import { createCuenta } from "../controllers/cuentasController";
import "./CreateCuentaModal.css";

export default function CreateCuentaModal({ open, onClose, onCreated }) {
    const [nombre, setNombre] = useState("");

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!nombre.trim()) return;

        await createCuenta({ nombre });
        setNombre("");
        onCreated();
        onClose();
    }

    if (!open) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Nueva Cuenta</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nombre de la cuenta"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>

                        <button type="submit" className="btn-primary">
                            Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}