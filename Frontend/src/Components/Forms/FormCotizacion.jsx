
import { createCotizacion } from "../../controllers/investmentsController";
import { handleFormattedPriceChange } from "../../Services/utils";
import { CalendarDays, Loader2 } from "lucide-react";
import { useState } from "react";

function FormCotizacion({ broker, onSuccess, onClose }) {

    const today = new Date();
    const fechaActual = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [form, setForm] = useState({
        valor: "",
        valorFormatted: "",
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
                moneda: broker.idmoneda,
                fecha: form.fecha,
                valor: Number(form.valor),
            };

            await createCotizacion(data);

            onSuccess?.();

        } catch (err) {
            setError(
                err.message || "Error al registrar la cotización"
            );
        } finally {
            setLoading(false);
        }
    };

    const isInvalid =
        !form.valor ||
        Number(form.valor) <= 0 ||
        !form.fecha ||
        form.fecha > fechaActual ||
        loading;

    return (
        <>
            <div className="purchase-form__header">
                <div>
                    <span className="purchase-form__eyebrow">
                        Inversión
                    </span>
                    <h2>Actualizar cotización</h2>
                    <p>
                        Registra la tasa de cambio de {broker.moneda} a COP.
                    </p>
                </div>
            </div>

            <div className="purchase-form__body">

                <div className="form-group">
                    <label>Moneda</label>

                    <div className="form-input">
                        <input
                            type="text"
                            value={`${broker.moneda} → COP`}
                            disabled
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="valor">
                        Valor de la cotización
                    </label>

                    <div className="form-input">
                        <input
                            id="valor"
                            name="valor"
                            type="text"
                            inputMode="numeric"
                            value={form.valorFormatted}
                            onChange={(e) =>
                                handleFormattedPriceChange(
                                    e,
                                    setForm,
                                    "valor"
                                )
                            }
                            placeholder="3.160"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="fecha">
                        Fecha de cotización
                    </label>

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

export default FormCotizacion;
