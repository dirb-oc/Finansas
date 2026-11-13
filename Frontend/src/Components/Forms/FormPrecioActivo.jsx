
import { createPrecioActivo } from "../../controllers/investmentsController";
import { CalendarDays, Loader2 } from "lucide-react";
import { useState } from "react";

function FormPrecioActivo({ activo, onSuccess, onClose }) {

    const today = new Date();

    const fechaActual = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [form, setForm] = useState({
        precio: "",
        fecha: fechaActual,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = {
                activo: activo.activo_id,
                fecha: form.fecha,
                precio: Number(form.precio),
            };

            await createPrecioActivo(data);

            onSuccess?.();

        } catch (err) {
            setError(
                err.message || "Error al registrar el precio del activo"
            );
        } finally {
            setLoading(false);
        }
    };

    const isInvalid =
        !form.precio ||
        !Number.isFinite(Number(form.precio)) ||
        Number(form.precio) <= 0 ||
        !form.fecha ||
        form.fecha > fechaActual ||
        loading;

    return (
        <>
            <div className="purchase-form__header">
                <div>

                    <span className="purchase-form__eyebrow">Inversión</span>
                    <h2>Actualizar precio</h2>
                    <p>Registra una nueva cotización para tu activo.</p>
                
                </div>
            </div>

            <div className="purchase-form__body">

                <div className="form-group">
                    <label>Activo</label>

                    <div className="form-input">
                        <input
                            type="text"
                            value={`${activo.ticker} · ${activo.nombre}`}
                            disabled
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Precio ({activo.moneda})</label>

                    <div className="form-input">
                        <input
                            name="precio"
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            value={form.precio}
                            onChange={handleChange}
                            placeholder="Ej. 314.25"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="fecha">Fecha de cotización</label>

                    <div className="form-input">
                        <CalendarDays size={18} />

                        <input
                            id="fecha"
                            name="fecha"
                            type="date"
                            value={form.fecha}
                            max={fechaActual}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {error && (
                    <div className="purchase-form__error">
                        {error}
                    </div>
                )}

            </div>

            <div className="purchase-form__footer">
                <button
                    type="button"
                    className="purchase-form__button purchase-form__button--secondary"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    className="purchase-form__button purchase-form__button--primary"
                    onClick={handleSave}
                    disabled={isInvalid}
                >
                    {loading ? (
                        <>
                            <Loader2
                                size={18}
                                className="purchase-form__spinner"
                            />
                            Guardando...
                        </>
                    ) : (
                        "Guardar cotización"
                    )}
                </button>
            </div>
        </>
    );
}

export default FormPrecioActivo;