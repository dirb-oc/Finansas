import { CalendarDays, FileText, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { createMovimiento, updateMovimiento } from "../../controllers/movimientosController";
import { getTipos } from "../../controllers/tiposController";
import { handleFormattedPriceChange, getToday} from "../../Services/utils";
import { useEffect, useState } from "react";
import "./FormAdd.css";

function FormMovimiento({ cuenta, movimiento = null, onSuccess, onClose }) {

    const [tipos, setTipos] = useState([]);
    const [tipoMovimiento, setTipoMovimiento] = useState("gasto");
    const [loading, setLoading] = useState(false);
    const [loadingTipos, setLoadingTipos] = useState(true);

    const [error, setError] = useState(null);

    const [form, setForm] = useState({ tipo: "", monto: "", montoFormatted: "", descripcion: "", fecha: getToday(), });


    useEffect(() => {
        if (!movimiento) {

            setTipoMovimiento("gasto");
            setForm({ tipo: "", monto: "", montoFormatted: "", descripcion: "", fecha: getToday(), });

            return;
        }

        const monto = movimiento.monto || "";

        setTipoMovimiento(movimiento.tipo_base);

        setForm({
            tipo: String(movimiento.tipo),
            monto: String(monto),
            montoFormatted: monto
                ? Number(monto).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                })
                : "",
            descripcion: movimiento.descripcion || "",
            fecha: movimiento.fecha
                ? movimiento.fecha.split("T")[0]
                : "",
        });
    }, [movimiento]);

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

    const tiposFiltrados = tipos.filter(tipo => tipo.tipo === tipoMovimiento);

    // Cambios del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value, }));
    };

    const handleTipoMovimientoChange = (tipo) => {
        setTipoMovimiento(tipo);
        setForm(prev => ({ ...prev, tipo: "" }));
    };

    // Guardar movimiento
    const handleSave = async () => {

        try {

            setLoading(true);
            setError(null);

            const data = {
                cuenta: Number(cuenta),
                tipo: Number(form.tipo),
                monto: Number(form.monto),
                descripcion: form.descripcion,
                fecha: form.fecha,
            };

            if (movimiento) {
                await updateMovimiento(movimiento.id, data);
            } else {
                await createMovimiento(data);
            }

            onSuccess?.();

        } catch (err) {

            setError(
                err.message ||
                "Error al guardar el movimiento"
            );

        } finally {

            setLoading(false);
        }
    };

    return (

        <>
            <div className="purchase-form__header">
                <div>

                    <h2> {movimiento ? "Editar movimiento" : "Nuevo movimiento" } </h2>

                    <p>
                        {movimiento
                        ? "Modifica los datos de este movimiento."
                        : "Registra un ingreso o gasto en esta cuenta."
                        }
                    </p>

                </div>

            </div>


            <div className="purchase-form__body">

                {loadingTipos ? (

                    <div className="purchase-form__loading">

                        <Loader2 size={22} className="purchase-form__spinner" />
                        Cargando tipos...

                    </div>

                ) : (

                    <>
                        {/* Tipo de movimiento */}
                        <div className="form-group">

                            <label>Tipo de movimiento</label>
                            <div className="movement-type">

                                <label
                                    className={`movement-type__option movement-type__option--expense ${tipoMovimiento === "gasto"
                                        ? "movement-type__option--active"
                                        : ""
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        value="gasto"
                                        checked={tipoMovimiento === "gasto"}
                                        onChange={() => handleTipoMovimientoChange("gasto")}
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
                                        value="ingreso"
                                        checked={tipoMovimiento === "ingreso"}
                                        onChange={() => handleTipoMovimientoChange("ingreso")}
                                    />

                                    <div className="movement-type__icon">
                                        <ArrowUpCircle size={22} />
                                    </div>

                                    <div className="movement-type__content">
                                        <span className="movement-type__title">Ingreso</span>

                                        <span className="movement-type__description">Dinero que entra</span>
                                    </div>

                                    <div className="movement-type__check">
                                        ✓
                                    </div>
                                </label>

                            </div>


                        </div>

                        <div className="purchase-form__grid">

                            <div className="form-group form-group--amount">

                                <label htmlFor="monto">Monto</label>

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
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label htmlFor="fecha">Fecha</label>

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


                        {/* Tipo específico */}

                        <div className="form-group">

                            <label htmlFor="tipo">Categoría</label>

                            <div className="form-input">

                                <FileText size={18} />

                                <select
                                    name="tipo"
                                    value={form.tipo}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Selecciona una categoría
                                    </option>

                                    {tiposFiltrados.map((tipo) => (
                                        <option key={tipo.id} value={String(tipo.id)}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>

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
                        movimiento ? "Guardar cambios" : "Registrar movimiento"
                    )}

                </button>

            </div>

        </>

    );

}

export default FormMovimiento;