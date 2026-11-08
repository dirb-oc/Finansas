
import { finalizarCDT } from "../../controllers/investmentsController";
import { CalendarDays, Loader2 } from "lucide-react";
import { handleFormattedPriceChange } from "../../Services/utils";
import { useState } from "react";

function FormFinalizarCDT({ cdt, onSuccess, onClose }) {

    const [form, setForm] = useState({
        monto_recibido: "",
        monto_recibidoFormatted: "",
        fecha_cierre: "",
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
                monto_recibido: Number(form.monto_recibido),
                fecha_cierre: form.fecha_cierre,
            };

            await finalizarCDT(cdt.id, data);

            onSuccess?.();

        } catch (err) {
            setError(
                err.message || "Error al finalizar el CDT"
            );
        } finally {
            setLoading(false);
        }
    };

    const isInvalid =
        !form.monto_recibido ||
        Number(form.monto_recibido) <= 0 ||
        !form.fecha_cierre ||
        loading;

    return (
        <>
            <div className="purchase-form__header">
                <div>
                    <span className="purchase-form__eyebrow">
                        Inversión
                    </span>
                    <h2>Finalizar CDT</h2>
                    <p>
                        Registra el capital recibido al cerrar tu inversión.
                    </p>
                </div>
            </div>

            <div className="purchase-form__body">

                <div className="form-group">
                    <label htmlFor="monto_recibido">
                        Monto recibido
                    </label>

                    <div className="form-input">

                        <input
                            id="monto_recibido"
                            name="monto_recibido"
                            type="text"
                            inputMode="numeric"
                            value={form.monto_recibidoFormatted}
                            onChange={(e) =>
                                handleFormattedPriceChange(
                                    e,
                                    setForm,
                                    "monto_recibido"
                                )
                            }
                            placeholder="$1.000.000"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="fecha_cierre">
                        Fecha de cierre
                    </label>

                    <div className="form-input">
                        <CalendarDays size={18} />

                        <input
                            id="fecha_cierre"
                            name="fecha_cierre"
                            type="date"
                            value={form.fecha_cierre}
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
                            Finalizando...
                        </>
                    ) : (
                        "Finalizar CDT"
                    )}
                </button>
            </div>
        </>
    );
}

export default FormFinalizarCDT;
