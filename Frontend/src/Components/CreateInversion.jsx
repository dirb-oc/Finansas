import { useState, useEffect } from "react";
import { createInversion } from "../controllers/inversionesController";
import { getCuentas } from "../controllers/cuentasController";
import "./CreateInversion.css";

export default function CreateInversion({ onClose, onCreated }) {
    const [form, setForm] = useState({
        nombre: "",
        tipo: "",
        monto_inicial: "",
        cuenta: "",
        fecha_fin : "",
    });

    const [cuentas, setCuentas] = useState([]);

    useEffect(() => {
        getCuentas().then(setCuentas);
    }, []);

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
                monto_inicial: parseFloat(form.monto_inicial),
            });

            onCreated(); // refrescar lista
            onClose();   // cerrar modal
        } catch (err) {
            console.error(err);
            alert("Error creando inversión");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">

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
                        type="number"
                        name="monto_inicial"
                        placeholder="Monto inicial"
                        value={form.monto_inicial}
                        onChange={handleChange}
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