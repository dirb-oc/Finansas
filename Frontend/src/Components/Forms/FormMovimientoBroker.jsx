
import { useEffect, useState } from "react";
import { CalendarDays, Wallet, Landmark, ArrowDownLeft, ArrowUpRight, Loader2, } from "lucide-react";

import { createMovimientoBroker } from "../../controllers/investmentsController";
import { getCotizacion } from "../../controllers/investmentsController";
import { getCuentas } from "../../controllers/AccountController";
import formatCOP, { getToday } from "../../Services/utils";

function FormMovimientoBroker({ broker, onSuccess, onClose }) {

    const [cuentas, setCuentas] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [cotizacion, setCotizacion] = useState(null);
    const [loadingCotizacion, setLoadingCotizacion] = useState(false);

    const [form, setForm] = useState({
        tipo: "entrada",
        cuenta: "",
        monto: "",
        costo: "",
        fecha: getToday(),
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                setError(null);

                const data = await getCuentas();
                setCuentas(data);

            } catch (err) {
                setError(err.message || "Error al cargar las cuentas");
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!broker?.idmoneda || !form.fecha) return;

        setLoadingCotizacion(true);

        getCotizacion(broker.idmoneda, form.fecha)
            .then(setCotizacion)
            .catch((error) => {
                console.error("Error obteniendo cotización:", error);
                setCotizacion(null);
            })
            .finally(() => setLoadingCotizacion(false));

    }, [broker?.idmoneda, form.fecha]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const cuentaSeleccionada = cuentas.find(
        cuenta => cuenta.id === Number(form.cuenta)
    );

    const monto = Number(form.monto) || 0;
    const costo = Number(form.costo) || 0;
    const tasa = Number(cotizacion?.valor) || 0;

    const valorConvertido = monto * tasa;

    const totalCOP = form.tipo === "entrada"
        ? valorConvertido + costo
        : valorConvertido - costo;

    // Saldo de la cuenta bancaria después del movimiento.
    const saldoCuenta = Number(cuentaSeleccionada?.saldo || 0);

    const saldoCuentaFinal = form.tipo === "entrada"
        ? saldoCuenta - totalCOP
        : saldoCuenta + totalCOP;

    // Saldo disponible del broker después del movimiento.
    const saldoBroker = Number(broker.saldo_disponible || 0);

    const saldoBrokerFinal = form.tipo === "entrada"
        ? saldoBroker + monto
        : saldoBroker - monto;

    const isEntrada = form.tipo === "entrada";

    const fechaActual = getToday();

    const saldoInsuficienteCuenta =
        isEntrada && cuentaSeleccionada && totalCOP > saldoCuenta;

    const saldoInsuficienteBroker =
        !isEntrada && monto > saldoBroker;

    const isInvalid =
        !form.cuenta ||
        !form.monto ||
        monto <= 0 ||
        !form.costo ||
        costo <= 0 ||
        !form.fecha ||
        form.fecha > fechaActual ||
        saldoInsuficienteCuenta ||
        saldoInsuficienteBroker ||
        loading ||
        loadingData;

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = {
                broker: broker.broker_id,
                moneda: broker.idmoneda,
                tipo: form.tipo,
                monto,
                costo,
                cuenta: Number(form.cuenta),
                fecha: form.fecha,
            };

            await createMovimientoBroker(data);

            onSuccess?.();

        } catch (err) {
            setError(
                err.message || "Error al registrar el movimiento"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="purchase-form__header">
                <div>
                    <span className="purchase-form__eyebrow">
                        Inversión · {broker.broker}
                    </span>

                    <h2>Registrar movimiento</h2>

                    <p>Registra un depósito o retiro de efectivo del broker.</p>
                </div>
            </div>

            <div className="purchase-form__body">

                {loadingData ? (
                    <div className="purchase-form__loading">
                        <Loader2
                            size={22}
                            className="purchase-form__spinner"
                        />
                        Cargando información...
                    </div>
                ) : (
                    <>
                        {/* Tipo de movimiento */}
                        <div className="form-group">
                            <label>Tipo de movimiento</label>

                            <div className="broker-movement-types">
                                <button
                                    type="button"
                                    className={isEntrada ? "active entrada" : ""}
                                    onClick={() => setForm(prev => ({
                                        ...prev,
                                        tipo: "entrada",
                                    }))}
                                >
                                    <ArrowDownLeft size={17} />
                                    Entrada
                                </button>

                                <button
                                    type="button"
                                    className={!isEntrada ? "active salida" : ""}
                                    onClick={() => setForm(prev => ({
                                        ...prev,
                                        tipo: "salida",
                                    }))}
                                >
                                    <ArrowUpRight size={17} />
                                    Salida
                                </button>
                            </div>
                        </div>

                        {/* Información del broker */}
                        <div className="purchase-form__info">
                            <div>
                                <span>
                                    <Landmark size={14} />
                                    Broker
                                </span>
                                <strong>{broker.broker}</strong>
                            </div>

                            <div>
                                <span>Moneda</span>
                                <strong>{broker.moneda}</strong>
                            </div>

                            <div>
                                <span>Saldo disponible</span>
                                <strong>
                                    {broker.moneda}{" "}
                                    {saldoBroker.toLocaleString("es-CO", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 8,
                                    })}
                                </strong>
                            </div>
                        </div>

                        {/* Cuenta bancaria */}
                        <div className="purchase-form__grid">

                            {/* Cuenta */}
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

                            {/* Monto */}
                            <div className="form-group">
                                <label>Monto ({broker.moneda})</label>

                                <input
                                    type="number"
                                    className="form-input"
                                    min="0"
                                    step="any"
                                    placeholder="0.00"
                                    value={form.monto}
                                    onChange={(e) => setForm({
                                        ...form,
                                        monto: e.target.value
                                    })}
                                />
                            </div>

                        </div>

                        <div className="purchase-form__grid">

                            {/* Costo */}
                            <div className="form-group">
                                <label>Costo (COP)</label>

                                <input
                                    type="number"
                                    className="form-input"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    value={form.costo}
                                    onChange={(e) => setForm({
                                        ...form,
                                        costo: e.target.value
                                    })}
                                />
                            </div>

                            {/* Fecha */}
                            <div className="form-group">
                                <label htmlFor="fecha">
                                    Fecha del movimiento
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
                        </div>


                        {/* Resumen de la operación */}

                        <div className="broker-movement-summary">
                            <div>
                                <span>
                                    {isEntrada
                                        ? "Total a depositar"
                                        : "Total a recibir"}
                                </span>

                                <strong>
                                    {formatCOP(totalCOP)}
                                </strong>
                            </div>

                            {cuentaSeleccionada && (
                                <div>
                                    <span>
                                        Saldo de cuenta después del movimiento
                                    </span>

                                    <strong className={
                                        saldoCuentaFinal < 0
                                            ? "negativo"
                                            : ""
                                    }>
                                        {formatCOP(saldoCuentaFinal)}
                                    </strong>
                                </div>
                            )}

                            <div>
                                <span>Saldo del broker después del movimiento</span>

                                <strong className={
                                    saldoBrokerFinal < 0
                                        ? "negativo"
                                        : ""
                                }>
                                    {broker.moneda}{" "}
                                    {saldoBrokerFinal.toLocaleString("es-CO", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 8,
                                    })}
                                </strong>
                            </div>
                        </div>

                        {saldoInsuficienteCuenta && (
                            <div className="purchase-form__error">
                                El saldo de la cuenta no es suficiente para realizar este depósito.
                            </div>
                        )}

                        {saldoInsuficienteBroker && (
                            <div className="purchase-form__error">
                                El broker no tiene suficiente efectivo para realizar este retiro.
                            </div>
                        )}

                        {error && (
                            <div className="purchase-form__error">
                                {error}
                            </div>
                        )}
                    </>
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
                        "Registrar movimiento"
                    )}
                </button>
            </div>
        </>
    );
}

export default FormMovimientoBroker;