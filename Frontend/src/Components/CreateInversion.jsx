import { useState, useEffect } from "react";
import { createInversion } from "../controllers/inversionesController";
import { getCuentas } from "../controllers/cuentasController";
import "./CreateInversion.css";

const formatCOP = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value || 0);

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

    const parseMonto = (value) => {
        const num = value.replace(/[$,.]/g, "");
        return num ? parseFloat(num) : "";
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Nueva Inversión</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        name="nombre"
                        placeholder="Nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="tipo"
                        value={form.tipo}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona tipo</option>
                        <option value="cdt">CDT</option>
                        <option value="crypto">Cripto</option>
                        <option value="acciones">Acciones</option>
                        <option value="otro">Otro</option>
                    </select>

                    <input
                        type="text"
                        name="monto_inicial"
                        placeholder={`Monto inicial (${formatCOP(0)})`}
                        value={form.monto_inicial}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, "");
                            setForm({ ...form, monto_inicial: val });
                        }}
                        onBlur={(e) => {
                            const num = parseFloat(e.target.value.replace(/[^\d]/g, ""));
                            if (num) {
                                setForm({ ...form, monto_inicial: num.toString() });
                            }
                        }}
                        required
                    />

                    <select
                        name="cuenta"
                        value={form.cuenta}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona cuenta</option>
                        {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        name="fecha_fin"
                        value={form.fecha_fin || ""}
                        onChange={handleChange}
                    />

                    <div className="modal-actions">
                        <button type="submit">Crear</button>
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}