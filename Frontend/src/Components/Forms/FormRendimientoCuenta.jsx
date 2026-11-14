
import { useEffect, useState } from "react";
import { getCuentas } from "../../controllers/AccountController";
import { createRendimientoCuenta } from "../../controllers/investmentsController";
import formatCOP, { getToday } from "../../Services/utils";

export default function FormRendimientoCuenta({ onSuccess, onClose }) {
    const [cuentas, setCuentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        cuenta: "",
        fecha: getToday(),
        monto: ""
    });

    useEffect(() => {
        getCuentas()
            .then(setCuentas)
            .catch((err) => {
                console.error("Error cargando cuentas:", err);
                setError("No se pudieron cargar las cuentas.");
            })
            .finally(() => setLoading(false));
    }, []);

    const cuentaSeleccionada = cuentas.find(
        (cuenta) => String(cuenta.id) === String(form.cuenta)
    );

    const monto = Number(form.monto) || 0;
    const saldoActual = Number(cuentaSeleccionada?.saldo) || 0;
    const saldoNuevo = saldoActual + monto;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.cuenta) {
            setError("Selecciona una cuenta.");
            return;
        }

        if (monto <= 0) {
            setError("El monto debe ser mayor a cero.");
            return;
        }

        if (!form.fecha) {
            setError("Selecciona una fecha.");
            return;
        }

        setError("");
        setSaving(true);

        try {
            await createRendimientoCuenta({
                cuenta: Number(form.cuenta),
                fecha: form.fecha,
                monto
            });

            onSuccess?.();

        } catch (err) {
            console.error("Error registrando rendimiento:", err);

            const response = err?.response?.data;
            const message = typeof response === "string"
                ? response
                : response?.detail ||
                response?.monto ||
                response?.cuenta ||
                response?.fecha ||
                "No se pudo registrar el rendimiento.";

            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="loading">Cargando cuentas...</p>;
    }

    return (
        <>
            <div className="form-add" onSubmit={handleSubmit}>

                <div className="purchase-form__header">
                    <div>
                        <h2>Registrar rendimiento</h2>
                        <p>Registra los intereses generados por una cuenta.</p>
                    </div>
                </div>

                <div className="purchase-form__body">

                    <div className="form-group">
                        <label>Cuenta</label>

                        <div className="form-input">
                            <select
                                className="cuenta"
                                value={form.cuenta}
                                onChange={(e) => setForm({
                                    ...form,
                                    cuenta: e.target.value
                                })}
                            >
                                <option value="">Seleccionar cuenta</option>

                                {cuentas.map((cuenta) => (
                                    <option key={cuenta.id} value={cuenta.id}>
                                        {cuenta.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Monto del rendimiento (COP)</label>

                        <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={form.monto}
                            onChange={(e) => setForm({
                                ...form,
                                monto: e.target.value
                            })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Fecha</label>

                        <input
                            type="date"
                            className="form-input"
                            max={getToday()}
                            value={form.fecha}
                            onChange={(e) => setForm({
                                ...form,
                                fecha: e.target.value
                            })}
                        />
                    </div>

                    {cuentaSeleccionada && (
                        <div className="broker-movement-summary">
                            <div>
                                <span>Saldo actual</span>
                                <strong>{formatCOP(saldoActual)}</strong>
                            </div>

                            <div>
                                <span>Saldo después del rendimiento</span>
                                <strong className="plus">
                                    {formatCOP(saldoNuevo)}
                                </strong>
                            </div>
                        </div>
                    )}


                    {error && (
                        <p className="form-error">{error}</p>
                    )}
                </div>

                <div className="purchase-form__footer">
                    <button
                        type="button"
                        className="purchase-form__button purchase-form__button--secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="purchase-form__button purchase-form__button--primary"
                        disabled={saving}
                    >
                        {saving ? "Guardando..." : "Registrar rendimiento"}
                    </button>
                </div>
            </div>
        </>
    );
}
