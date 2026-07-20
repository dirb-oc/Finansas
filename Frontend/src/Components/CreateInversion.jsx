import { useState, useEffect } from "react";
import { createInversion } from "../controllers/inversionesController";
import { getCuentas } from "../controllers/cuentasController";
import CustomSelect from "./CustomSelect"
import formatCOP from "../Services/utils";
import "./CreateInversion.css";

export default function CreateInversion({ onClose, onCreated }) {
    const [form, setForm] = useState({
        nombre: "",
        tipo: "",
        monto_inicial: "",
        cuenta: "",
        fecha_fin: "",
    });

    const [cuentas, setCuentas] = useState([]);

    useEffect(() => {
        getCuentas().then(setCuentas);
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await createInversion({
                ...form,
                monto_inicial: parseFloat(form.monto_inicial.replace(/[$,.]/g, "")),
            });

            onCreated();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error creando inversión");
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Nueva Inversión</h2>

                <form onSubmit={handleSubmit} className="form-grid">

                    {/* NOMBRE */}
                    <div className="form-group">
                        <label className="form-label">
                            Nombre de la inversión
                        </label>

                        <input
                            className="form-input"
                            name="nombre"
                            placeholder="Ej: Bitcoin largo plazo"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* TIPO */}
                    <div className="form-group">
                        <label className="form-label">
                            Tipo de inversión
                        </label>

                        <CustomSelect
                            value={String(form.tipo || "")}
                            onChange={(value) =>
                                setForm({ ...form, tipo: value })
                            }
                            options={[
                                { id: "cdt", nombre: "CDT" },
                                { id: "crypto", nombre: "Cripto" },
                                { id: "acciones", nombre: "Acciones" },
                                { id: "otro", nombre: "Otro" },
                            ]}
                            placeholder="Seleccionar tipo"
                        />
                    </div>

                    {/* MONTO */}
                    <div className="form-group">
                        <label className="form-label">
                            Monto inicial
                        </label>

                        <input
                            className="form-input"
                            type="text"
                            name="monto_inicial"
                            placeholder={formatCOP(0)}
                            value={
                                form.monto_inicial
                                    ? formatCOP(form.monto_inicial)
                                    : ""
                            }
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, "");

                                setForm({
                                    ...form,
                                    monto_inicial: val,
                                });
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(
                                    e.target.value.replace(/[^\d]/g, "")
                                );

                                if (num) {
                                    setForm({
                                        ...form,
                                        monto_inicial: num.toString(),
                                    });
                                }
                            }}
                            required
                        />
                    </div>

                    {/* CUENTA */}
                    <div className="form-group">
                        <label className="form-label">
                            Cuenta asociada
                        </label>

                        <CustomSelect
                            value={String(form.cuenta || "")}
                            onChange={(value) =>
                                setForm({ ...form, cuenta: value })
                            }
                            options={cuentas.map((c) => ({
                                id: String(c.id),
                                nombre: c.nombre,
                            }))}
                            placeholder="Seleccionar cuenta"
                        />
                    </div>

                    {/* FECHA */}
                    <div className="form-group">
                        <label className="form-label">
                            Fecha final (opcional)
                        </label>

                        <input
                            className="form-input"
                            type="date"
                            name="fecha_fin"
                            value={form.fecha_fin || ""}
                            onChange={handleChange}
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Crear inversión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}