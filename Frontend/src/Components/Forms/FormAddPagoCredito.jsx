import {
    CalendarDays,
    CreditCard,
    DollarSign,
    Wallet,
    Loader2
} from "lucide-react";

import { useEffect, useState } from "react";

import {
    getComprasPendientes,
    CreatePago
} from "../../controllers/cardController";

import { getCuentas } from "../../controllers/AccountController";

import "./FormAdd.css";

function FormAddPagoCredito({ onSuccess, onClose }) {

    const [compras, setCompras] = useState([]);
    const [cuentas, setCuentas] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        compra: "",
        cuenta: "",
        monto: "",
        fecha: "",
    });

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoadingData(true);
                setError(null);

                const [comprasData, cuentasData] = await Promise.all([
                    getComprasPendientes(),
                    getCuentas()
                ]);

                setCompras(comprasData);
                setCuentas(cuentasData);

            } catch (err) {

                setError(
                    err.message || "Error al cargar la información"
                );

            } finally {

                setLoadingData(false);

            }
        };

        loadData();

    }, []);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));

    };

    const compraSeleccionada = compras.find(
        compra => compra.id === Number(form.compra)
    );

    const cuentaSeleccionada = cuentas.find(
        cuenta => cuenta.id === Number(form.cuenta)
    );

    const handleSave = async () => {

        try {

            setLoading(true);
            setError(null);

            await CreatePago({

                compra: Number(form.compra),

                cuenta: Number(form.cuenta),

                monto: Number(form.monto),

                fecha: form.fecha,

            });

            onSuccess?.();

        } catch (err) {

            setError(
                err.message || "Error al registrar el pago"
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
                        Pago de tarjeta
                    </span>

                    <h2>Registrar pago</h2>

                    <p>
                        Registra un pago realizado a una compra de crédito.
                    </p>

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

                        {/* Compra */}

                        <div className="form-group">

                            <label htmlFor="compra">
                                Compra
                            </label>

                            <div className="form-input">

                                <CreditCard size={18} />

                                <select
                                    id="compra"
                                    name="compra"
                                    value={form.compra}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Selecciona una compra
                                    </option>

                                    {compras.map(compra => (

                                        <option
                                            key={compra.id}
                                            value={compra.id}
                                        >
                                            {compra.descripcion || `Compra #${compra.id}`}
                                            {" - "}
                                            ${compra.monto}
                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        {/* Información de la compra */}

                        {compraSeleccionada && (

                            <div className="purchase-form__info">

                                <div>

                                    <span>
                                        Tarjeta
                                    </span>

                                    <strong>
                                        {compraSeleccionada.tarjeta_nombre}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Saldo pendiente
                                    </span>

                                    <strong>
                                        ${compraSeleccionada.saldo_pendiente}
                                    </strong>

                                </div>

                            </div>

                        )}


                        <div className="purchase-form__grid">

                            {/* Cuenta */}

                            <div className="form-group">

                                <label htmlFor="cuenta">
                                    Cuenta
                                </label>

                                <div className="form-input">

                                    <Wallet size={18} />

                                    <select
                                        id="cuenta"
                                        name="cuenta"
                                        value={form.cuenta}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Selecciona una cuenta
                                        </option>

                                        {cuentas.map(cuenta => (

                                            <option
                                                key={cuenta.id}
                                                value={cuenta.id}
                                            >
                                                {cuenta.nombre}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>


                            {/* Fecha */}

                            <div className="form-group">

                                <label htmlFor="fecha">
                                    Fecha del pago
                                </label>

                                <div className="form-input">

                                    <CalendarDays size={18} />

                                    <input
                                        id="fecha"
                                        name="fecha"
                                        type="date"
                                        value={form.fecha}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                        </div>


                        {/* Monto */}

                        <div className="form-group form-group--amount">

                            <label htmlFor="monto">
                                Monto del pago
                            </label>

                            <div className="form-input form-input--amount">

                                <DollarSign size={20} />

                                <input
                                    id="monto"
                                    name="monto"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={
                                        compraSeleccionada
                                            ? compraSeleccionada.saldo_pendiente
                                            : undefined
                                    }
                                    value={form.monto}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    autoFocus
                                />

                            </div>

                        </div>


                        {/* Información de la cuenta */}

                        {cuentaSeleccionada && (

                            <div className="purchase-form__info">

                                <div>

                                    <span>
                                        Cuenta
                                    </span>

                                    <strong>
                                        {cuentaSeleccionada.nombre}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Saldo disponible
                                    </span>

                                    <strong>
                                        ${cuentaSeleccionada.saldo}
                                    </strong>

                                </div>

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
                    disabled={
                        loading ||
                        loadingData ||
                        !form.compra ||
                        !form.cuenta ||
                        !form.monto ||
                        !form.fecha
                    }
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

                        "Registrar pago"

                    )}

                </button>

            </div>

        </>

    );

}

export default FormAddPagoCredito;