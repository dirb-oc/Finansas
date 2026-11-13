import { CalendarDays, CreditCard, Wallet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getComprasPendientes } from "../../controllers/cardController";
import { getCuentas } from "../../controllers/AccountController";
import formatCOP, { handleFormattedPriceChange, getToday, } from "../../Services/utils";
import "./FormAdd.css";

function FormPagoCredito({ pago = null, onSubmit, onSuccess, onClose }) {

    const [compras, setCompras] = useState([]);
    const [cuentas, setCuentas] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [error, setError] = useState(null);

    const [form, setForm] = useState({ compra: "", cuenta: "", monto: "", montoFormatted: "", fecha: "", });

    /*
     * Cargar información necesaria para crear un pago
     */
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
                    err.message ||
                    "Error al cargar la información"
                );

            } finally {

                setLoadingData(false);

            }
        };

        loadData();

    }, []);

    /*
     * Cargar datos del pago cuando estamos editando
     */
    useEffect(() => {

        if (!pago) {

            setForm({ compra: "", cuenta: "", monto: "", montoFormatted: "", fecha: getToday(), });
            return;
        }

        const monto = pago.monto || "";

        setForm({
            compra: pago.compra ? String(pago.compra) : "",
            cuenta: pago.movimiento.cuenta ? String(pago.movimiento.cuenta) : "",
            monto: pago.monto || "",
            montoFormatted: monto
                ? Number(monto).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                })
                : "",
            fecha: pago.fecha ? pago.fecha.split("T")[0] : "",
        });

    }, [pago]);


    const handleChange = (e) => {

        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value, }));

    };


    const compraSeleccionada = compras.find(
        compra => compra.id === Number(form.compra)
    );


    const cuentaSeleccionada = cuentas.find(
        cuenta => cuenta.id === Number(form.cuenta)
    );

    const isEditing = Boolean(pago);

    const handleSave = async () => {

        try {

            setLoading(true);
            setError(null);


            const data = {
                compra: Number(form.compra),
                cuenta: Number(form.cuenta),
                monto: Number(form.monto),
                fecha: form.fecha,
            };


            await onSubmit(data);

            onSuccess?.();

        } catch (err) {

            setError(
                err.message ||
                "Error al guardar el pago"
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <>
            <div className="purchase-form__header">

                <div>

                    <span className="purchase-form__eyebrow">Pago de tarjeta</span>

                    <h2>{isEditing ? "Editar pago" : "Registrar pago"}</h2>

                    <p>
                        {isEditing
                            ? "Modifica los datos del pago realizado."
                            : "Registra un pago realizado a una compra de crédito."
                        }
                    </p>

                </div>

            </div>


            <div className="purchase-form__body">

                {loadingData ? (

                    <div className="purchase-form__loading">

                        <Loader2 size={22} className="purchase-form__spinner" />
                        Cargando información...

                    </div>

                ) : (

                    <>

                        {/* Compra */}

                        <div className="form-group">

                            <label htmlFor="compra">Compra</label>

                            <div className="form-input">

                                <CreditCard size={18} />

                                <select
                                    id="compra"
                                    name="compra"
                                    value={form.compra}
                                    onChange={handleChange}
                                    disabled={isEditing}
                                >

                                    <option value="">Selecciona una compra</option>

                                    {compras.map(compra => (

                                        <option key={compra.id} value={String(compra.id)} >
                                            {compra.descripcion ||
                                                `Compra #${compra.id}`}
                                            {" - "}
                                            {formatCOP(compra.monto)}
                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        {/* Información de la compra */}

                        {compraSeleccionada && (
                            <div className="purchase-form__info purchase-form__info--purchase">

                                <div>
                                    <span>Tarjeta</span>
                                    <strong>{compraSeleccionada.tarjeta_nombre}</strong>
                                </div>

                                <div>
                                    <span>Saldo pendiente</span>
                                    <strong className="purchase-form__amount">
                                        {formatCOP(compraSeleccionada.saldo_pendiente)}
                                    </strong>
                                </div>

                                <div>
                                    <span>Valor de la cuota</span>
                                    <strong className="purchase-form__amount">
                                        {formatCOP(
                                            Number(compraSeleccionada.monto) /
                                            Number(compraSeleccionada.numero_cuotas),

                                        )}
                                    </strong>
                                </div>

                            </div>
                        )}


                        <div className="purchase-form__grid">

                            {/* Cuenta */}

                            <div className="form-group">

                                <label htmlFor="cuenta">Cuenta</label>

                                <div className="form-input">

                                    <Wallet size={18} />

                                    <select
                                        id="cuenta"
                                        name="cuenta"
                                        value={form.cuenta}
                                        onChange={handleChange}
                                    // disabled={isEditing}
                                    >

                                        <option value="">
                                            Selecciona una cuenta
                                        </option>

                                        {cuentas.map(cuenta => (

                                            <option key={cuenta.id} value={String(cuenta.id)} >
                                                {cuenta.nombre}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>


                            {/* Fecha */}

                            <div className="form-group">

                                <label htmlFor="fecha">Fecha del pago</label>

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

                            <label htmlFor="monto">Monto del pago</label>

                            <div className="form-input form-input--amount">

                                <input
                                    id="monto"
                                    name="monto"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.montoFormatted || ""}
                                    onChange={(e) =>
                                        handleFormattedPriceChange(e, setForm, "monto")
                                    }
                                    placeholder="$10.000"
                                    max={
                                        compraSeleccionada
                                            ? Number(compraSeleccionada.saldo_pendiente) +
                                            (pago ? Number(pago.monto) : 0)
                                            : undefined
                                    }
                                />

                            </div>

                        </div>


                        {/* Información de la cuenta */}

                        {cuentaSeleccionada && (
                            <div className="purchase-form__info purchase-form__info--account">

                                <div>
                                    <span>
                                        <Wallet size={14} />
                                        Cuenta seleccionada
                                    </span>

                                    <strong>{cuentaSeleccionada.nombre}</strong>
                                </div>

                                <div>
                                    <span>Saldo disponible</span>

                                    <strong className="purchase-form__amount">
                                        {formatCOP(cuentaSeleccionada.saldo)}
                                    </strong>
                                </div>

                            </div>
                        )}


                        {error && (

                            <div className="purchase-form__error">{error}</div>

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
                            <Loader2 size={18} className="purchase-form__spinner" />
                            Guardando...
                        </>

                    ) : (

                        isEditing ? "Guardar cambios" : "Registrar pago"

                    )}

                </button>

            </div>

        </>
    );
}

export default FormPagoCredito;