
import { useEffect, useMemo, useState } from "react";

import { getActivos, createOperacionBroker } from "../../controllers/investmentsController";
import { getToday, formatMoney } from "../../Services/utils";

export default function FormOperacionActivo({ broker, onSuccess, onClose }) {
    const fechaActual = getToday();

    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        activo: "",
        tipo: "compra",
        cantidad: "",
        comision: "0",
        fecha: fechaActual
    });

    useEffect(() => {
        getActivos()
            .then(setActivos)
            .catch((err) => {
                console.error(err);
                setError("No se pudieron cargar los activos.");
            })
            .finally(() => setLoading(false));
    }, []);

    const activoSeleccionado = useMemo(
        () => activos.find(
            (item) => String(item.id) === String(form.activo)
        ),
        [activos, form.activo]
    );

    // Solo mostrar activos que correspondan
    // a la moneda del broker seleccionado.
    const activosDisponibles = useMemo(() => {
        return activos.filter(
            (item) => Number(item.moneda) === Number(broker?.idmoneda)
                && item.activo
        );
    }, [activos, broker]);

    const cantidad = Number(form.cantidad) || 0;
    const comision = Number(form.comision) || 0;
    const precio = Number(activoSeleccionado?.ultimo_precio) || 0;

    const valorOperacion = cantidad * precio;

    const totalOperacion = form.tipo === "compra"
        ? valorOperacion + comision
        : valorOperacion - comision;

    const disponibles = Number(activoSeleccionado?.cantidad) || 0;
    const saldoBroker = Number(broker?.saldo_disponible) || 0;

    const cotizacionDisponible = Boolean(
        activoSeleccionado?.ultimo_precio &&
        activoSeleccionado?.fecha_precio
    );

    const validarFormulario = () => {
        if (!form.activo) {
            return "Selecciona un activo.";
        }

        if (cantidad <= 0) {
            return "La cantidad debe ser mayor a cero.";
        }

        if (comision < 0) {
            return "La comisión no puede ser negativa.";
        }

        if (!cotizacionDisponible) {
            return "El activo no tiene un precio registrado.";
        }

        if (form.tipo === "venta" && cantidad > disponibles) {
            return `Solo tienes ${disponibles} unidades disponibles.`;
        }

        if (form.tipo === "compra" && totalOperacion > saldoBroker) {
            return "No tienes saldo suficiente en el broker.";
        }

        if (form.tipo === "venta" && totalOperacion < 0) {
            return "La comisión no puede superar el valor de la venta.";
        }

        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validarFormulario();

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setSaving(true);

        try {
            const data = {
                activo: Number(form.activo),
                broker: broker.broker_id,
                tipo: form.tipo,
                cantidad,
                comision,
                fecha: form.fecha
            };

            await createOperacionBroker(data);
            onSuccess?.();

        } catch (err) {
            console.error(err);

            const response = err?.response?.data;
            const message = typeof response === "string"
                ? response
                : response?.detail ||
                response?.cantidad ||
                response?.comision ||
                response?.fecha ||
                "No se pudo registrar la operación.";

            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <p className="purchase-form__loading">
                Cargando activos...
            </p>
        );
    }

    return (
        <form className="form-add" onSubmit={handleSubmit}>

            {/* Encabezado */}
            <div className="purchase-form__header">
                <div>
                    <h2>Nueva operación</h2>
                    <p>Registra una compra o venta de activos.</p>
                </div>
            </div>

            <div className="purchase-form__body">

                {/* Tipo de operación */}
                <div className="form-group">
                    <label>Tipo de operación</label>

                    <div className="broker-movement-types">
                        <button
                            type="button"
                            className={form.tipo === "compra" ? "active entrada" : ""}
                            onClick={() => setForm({
                                ...form,
                                tipo: "compra"
                            })}
                        >
                            Compra
                        </button>

                        <button
                            type="button"
                            className={form.tipo === "venta" ? "active salida" : ""}
                            onClick={() => setForm({
                                ...form,
                                tipo: "venta"
                            })}
                        >
                            Venta
                        </button>
                    </div>
                </div>

                <div className="purchase-form__grid">

                    {/* Activo */}
                    <div className="form-group">
                        <label>Activo</label>

                        <div className="form-input">
                            <select
                                className="cuenta"
                                value={form.activo}
                                onChange={(e) => setForm({
                                    ...form,
                                    activo: e.target.value
                                })}
                            >
                                <option value="">Seleccionar activo</option>

                                {activosDisponibles.map((activo) => (
                                    <option key={activo.id} value={activo.id}>
                                        {activo.ticker} · {activo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="form-group">
                        <label>Fecha de operación</label>

                        <input
                            type="date"
                            className="form-input"
                            value={form.fecha}
                            max={fechaActual}
                            onChange={(e) => setForm({
                                ...form,
                                fecha: e.target.value
                            })}
                        />
                    </div>
                </div>

                {/* Información del activo */}
                {activoSeleccionado && (
                    <div className="purchase-form__info">

                        <div>
                            <span>Precio registrado</span>

                            <strong>
                                {cotizacionDisponible
                                    ? formatMoney(
                                        activoSeleccionado.ultimo_precio,
                                        broker.moneda
                                    )
                                    : "Sin cotización"
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Ultima Fecha</span>
                            {activoSeleccionado.fecha_precio && (
                                <strong>
                                    {activoSeleccionado.fecha_precio}
                                </strong>
                            )}

                        </div>

                        <div>

                            <span>Disponible: </span>
                            <strong>{disponibles}</strong>

                        </div>
                    </div>
                )}

                {/* Cantidad y comisión */}
                <div className="purchase-form__grid">
                    <div className="form-group">
                        <label>Cantidad</label>

                        <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={form.cantidad}
                            onChange={(e) => setForm({
                                ...form,
                                cantidad: e.target.value
                            })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Comisión ({broker.moneda})</label>

                        <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={form.comision}
                            onChange={(e) => setForm({
                                ...form,
                                comision: e.target.value
                            })}
                        />
                    </div>
                </div>

                {/* Resumen */}
                <div className="broker-movement-summary">
                    <div>
                        <span>Valor de operación</span>
                        <strong>
                            {formatMoney(valorOperacion, broker.moneda)}
                        </strong>
                    </div>

                    <div>
                        <span>Comisión</span>
                        <strong>
                            {formatMoney(comision, broker.moneda)}
                        </strong>
                    </div>

                    <div className="summary-total">
                        <span>
                            {form.tipo === "compra"
                                ? "Total a descontar"
                                : "Total a recibir"
                            }
                        </span>

                        <strong>
                            {formatMoney(totalOperacion, broker.moneda)}
                        </strong>
                    </div>
                </div>

                {error && (
                    <div className="purchase-form__error">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="purchase-form__footer">
                <button
                    type="button"
                    className="purchase-form__button purchase-form__button--secondary"
                    onClick={onClose}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    className="purchase-form__button purchase-form__button--primary"
                    disabled={saving}
                >
                    {saving ? "Guardando..." : "Registrar operación"}
                </button>
            </div>

        </form>
    );
}