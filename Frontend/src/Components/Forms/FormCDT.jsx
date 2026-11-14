import { CalendarDays, Loader2, Wallet, Landmark, } from "lucide-react";
import { useEffect, useState } from "react";


import formatCOP, { handleFormattedPriceChange, getToday } from "../../Services/utils";
import { createCDT } from "../../controllers/investmentsController";
import { getCuentas } from "../../controllers/AccountController";

import "./FormAdd.css";

const initialForm = {
    cuenta: "",
    monto: "",
    montoFormatted: "",
    entidad: "",
    estado: "activa",
    fecha_inicio: getToday(),
    fecha_vencimiento: "",
};

function FormCDT({ onSuccess, onClose }) {

    const [cuentas, setCuentas] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [loading, setLoading] = useState(false);
    const [loadingCuentas, setLoadingCuentas] = useState(true);
    const [error, setError] = useState(null);

    // Cargar cuentas
    useEffect(() => {

        const loadCuentas = async () => {

            try {
                setLoadingCuentas(true);
                setError(null);

                const data = await getCuentas();
                setCuentas(data);

            } catch (err) {
                setError(
                    err.message || "Error al cargar las cuentas"
                );
            } finally {
                setLoadingCuentas(false);
            }

        };

        loadCuentas();

    }, []);

    // Cambios del formulario
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

    // Crear CDT
    const handleSave = async () => {

        try {

            setLoading(true);
            setError(null);

            const data = {
                cuenta: Number(form.cuenta),
                monto: Number(form.monto),
                entidad: form.entidad.trim(),
                estado: form.estado,
                fecha_inicio: form.fecha_inicio,
                fecha_vencimiento: form.fecha_vencimiento,
            };

            await createCDT(data);

            onSuccess?.();

        } catch (err) {

            setError(
                err.message || "Error al registrar el CDT"
            );

        } finally {
            setLoading(false);
        }

    };

    const isInvalid =
        !form.cuenta ||
        !form.monto ||
        Number(form.monto) <= 0 ||
        !form.entidad.trim() ||
        !form.fecha_inicio ||
        !form.fecha_vencimiento ||
        form.fecha_vencimiento < form.fecha_inicio ||
        loading ||
        loadingCuentas;

    return (
        <>

            {/* Encabezado */}
            <div className="purchase-form__header">

                <div>
                    <span className="purchase-form__eyebrow">Inversión</span>

                    <h2>Nuevo CDT</h2>

                    <p>Registra una inversión de renta fija.</p>
                </div>

            </div>

            {/* Cuerpo */}
            <div className="purchase-form__body">

                {loadingCuentas ? (

                    <div className="purchase-form__loading">
                        <Loader2
                            size={22}
                            className="purchase-form__spinner"
                        />
                        Cargando cuentas...
                    </div>

                ) : (

                    <>

                        {/* Monto */}
                        <div className="form-group form-group--amount">

                            <label htmlFor="monto">Capital invertido</label>

                            <div className="form-input form-input--amount">

                                <input
                                    id="monto"
                                    name="monto"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.montoFormatted}
                                    onChange={(e) =>
                                        handleFormattedPriceChange(
                                            e,
                                            setForm,
                                            "monto"
                                        )
                                    }
                                    placeholder="$1.000.000"
                                />

                            </div>

                        </div>

                        <div className="purchase-form__grid">

                            {/* Cuenta */}
                            <div className="form-group">

                                <label htmlFor="cuenta">Cuenta de origen</label>

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

                            {/* Entidad */}
                            <div className="form-group">

                                <label htmlFor="entidad">
                                    Entidad financiera
                                </label>

                                <div className="form-input">

                                    <Landmark size={18} />

                                    <input
                                        id="entidad"
                                        name="entidad"
                                        type="text"
                                        value={form.entidad}
                                        onChange={handleChange}
                                        placeholder="Ej. Nu, Bancolombia..."
                                    />

                                </div>

                            </div>



                        </div>


                        {/* Fechas */}
                        <div className="purchase-form__grid">

                            <div className="form-group">

                                <label htmlFor="fecha_inicio">
                                    Fecha de inicio
                                </label>

                                <div className="form-input">

                                    <CalendarDays size={18} />

                                    <input
                                        id="fecha_inicio"
                                        name="fecha_inicio"
                                        type="date"
                                        value={form.fecha_inicio}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label htmlFor="fecha_vencimiento">
                                    Fecha de vencimiento
                                </label>

                                <div className="form-input">

                                    <CalendarDays size={18} />

                                    <input
                                        id="fecha_vencimiento"
                                        name="fecha_vencimiento"
                                        type="date"
                                        min={form.fecha_inicio}
                                        value={form.fecha_vencimiento}
                                        onChange={handleChange}
                                    />

                                </div>

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
                            <div className="purchase-form__error">
                                {error}
                            </div>
                        )}

                    </>

                )}

            </div>

            {/* Footer */}
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
                        "Registrar CDT"
                    )}

                </button>

            </div>

        </>
    );

}

export default FormCDT;