import {
    CalendarDays,
    DollarSign,
    FileText,
    Loader2,
    ArrowDownCircle,
    ArrowUpCircle
} from "lucide-react";

import { useEffect, useState } from "react";

import {
    createMovimiento
} from "../../controllers/movimientosController";

import {
    getTipos
} from "../../controllers/tiposController";

import "./FormAdd.css";


function FormAddMovimiento({ cuenta, onSuccess, onClose }) {

    const [tipos, setTipos] = useState([]);

    const [tipoMovimiento, setTipoMovimiento] = useState("gasto");

    const [loading, setLoading] = useState(false);
    const [loadingTipos, setLoadingTipos] = useState(true);

    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        tipo: "",
        monto: "",
        descripcion: "",
        fecha: "",
    });

    useEffect(() => {

        const loadTipos = async () => {

            try {

                setLoadingTipos(true);
                setError(null);

                const data = await getTipos();

                setTipos(data);

            } catch (err) {

                setError(
                    err.message || "Error al cargar los tipos de movimiento"
                );

            } finally {

                setLoadingTipos(false);

            }

        };

        loadTipos();

    }, []);


    /*
     * Cuando cambia entre gasto / ingreso,
     * limpiamos el tipo seleccionado.
     */

    useEffect(() => {

        setForm(prev => ({
            ...prev,
            tipo: "",
        }));

    }, [tipoMovimiento]);


    /*
     * Tipos filtrados
     */

    const tiposFiltrados = tipos.filter(
        tipo => tipo.tipo === tipoMovimiento
    );


    /*
     * Cambios del formulario
     */

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value,
        }));

    };


    /*
     * Guardar movimiento
     */

    const handleSave = async () => {

        try {

            setLoading(true);
            setError(null);

            await createMovimiento({

                cuenta: Number(cuenta),

                tipo: Number(form.tipo),

                monto: Number(form.monto),

                descripcion: form.descripcion,

                fecha: form.fecha,

            });

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
                        Movimiento
                    </span>

                    <h2>Nuevo movimiento</h2>

                    <p>
                        Registra un ingreso o gasto en esta cuenta.
                    </p>

                </div>

            </div>


            <div className="purchase-form__body">

                {loadingTipos ? (

                    <div className="purchase-form__loading">

                        <Loader2
                            size={22}
                            className="purchase-form__spinner"
                        />

                        Cargando tipos...

                    </div>

                ) : (

                    <>

                        {/* Tipo de movimiento */}

                        <div className="form-group">

                            <label>
                                Tipo de movimiento
                            </label>

                            <div className="movement-type">

                                <label
                                    className={`movement-type__option movement-type__option--expense ${tipoMovimiento === "gasto"
                                            ? "movement-type__option--active"
                                            : ""
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="tipoMovimiento"
                                        value="gasto"
                                        checked={tipoMovimiento === "gasto"}
                                        onChange={(e) =>
                                            setTipoMovimiento(e.target.value)
                                        }
                                    />

                                    <div className="movement-type__icon">
                                        <ArrowDownCircle size={22} />
                                    </div>

                                    <div className="movement-type__content">
                                        <span className="movement-type__title">
                                            Gasto
                                        </span>

                                        <span className="movement-type__description">
                                            Dinero que sale
                                        </span>
                                    </div>

                                    <div className="movement-type__check">
                                        ✓
                                    </div>
                                </label>


                                <label
                                    className={`movement-type__option movement-type__option--income ${tipoMovimiento === "ingreso"
                                            ? "movement-type__option--active"
                                            : ""
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="tipoMovimiento"
                                        value="ingreso"
                                        checked={tipoMovimiento === "ingreso"}
                                        onChange={(e) =>
                                            setTipoMovimiento(e.target.value)
                                        }
                                    />

                                    <div className="movement-type__icon">
                                        <ArrowUpCircle size={22} />
                                    </div>

                                    <div className="movement-type__content">
                                        <span className="movement-type__title">
                                            Ingreso
                                        </span>

                                        <span className="movement-type__description">
                                            Dinero que entra
                                        </span>
                                    </div>

                                    <div className="movement-type__check">
                                        ✓
                                    </div>
                                </label>

                            </div>


                        </div>


                        {/* Tipo específico */}

                        <div className="form-group">

                            <label htmlFor="tipo">
                                Categoría
                            </label>

                            <div className="form-input">

                                <FileText size={18} />

                                <select
                                    id="tipo"
                                    name="tipo"
                                    value={form.tipo}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Selecciona una categoría
                                    </option>

                                    {tiposFiltrados.map(tipo => (

                                        <option
                                            key={tipo.id}
                                            value={tipo.id}
                                        >
                                            {tipo.nombre}
                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        <div className="purchase-form__grid">

                            {/* Monto */}

                            <div className="form-group form-group--amount">

                                <label htmlFor="monto">
                                    Monto
                                </label>

                                <div className="form-input form-input--amount">

                                    <DollarSign size={20} />

                                    <input
                                        id="monto"
                                        name="monto"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.monto}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        autoFocus
                                    />

                                </div>

                            </div>


                            {/* Fecha */}

                            <div className="form-group">

                                <label htmlFor="fecha">
                                    Fecha
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


                        {/* Descripción */}

                        <div className="form-group">

                            <label htmlFor="descripcion">
                                Descripción
                            </label>

                            <div className="form-input">

                                <FileText size={18} />

                                <input
                                    id="descripcion"
                                    name="descripcion"
                                    type="text"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    placeholder="Ej. Pago de servicios"
                                />

                            </div>

                        </div>


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
                        loadingTipos ||
                        !form.tipo ||
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

                        "Registrar movimiento"

                    )}

                </button>

            </div>

        </>

    );

}


export default FormAddMovimiento;