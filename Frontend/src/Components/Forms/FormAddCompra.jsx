import { CalendarDays, CreditCard, DollarSign, FileText, Layers3, Loader2 } from "lucide-react";
import { getTiposGasto } from "../../controllers/tiposController";
import { CreateCompra } from "../../controllers/cardController";
import { useEffect, useState } from "react";
import "./FormAdd.css";

function FormAddCompra({ tarjeta, onSuccess, onClose }) {

    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        monto: "",
        descripcion: "",
        fecha_compra: "",
        numero_cuotas: 1,
        tipo: "",
    });

    useEffect(() => {
        const loadTipos = async () => {
            try {
                const data = await getTiposGasto();
                setTipos(data);
            } catch (err) {
                setError(
                    err.message || "Error al cargar los tipos de gasto"
                );
            }
        };

        loadTipos();
    }, []);

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

            await CreateCompra({
                monto: Number(form.monto),
                descripcion: form.descripcion,
                fecha_compra: form.fecha_compra,
                numero_cuotas: Number(form.numero_cuotas),
                tarjeta,
                tipo: Number(form.tipo),
            });

            onSuccess?.();

        } catch (err) {
            setError(
                err.message || "Error al registrar la compra"
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
                        Tarjeta de crédito
                    </span>

                    <h2>Nueva compra</h2>

                    <p>Registra una compra realizada con esta tarjeta.</p>
                </div>

            </div>

            <div className="purchase-form__body">

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
                            placeholder="Ej. Compra supermercado"
                        />
                    </div>
                </div>

                <div className="purchase-form__grid">

                    {/* Fecha */}
                    <div className="form-group">
                        <label htmlFor="fecha_compra">
                            Fecha de compra
                        </label>

                        <div className="form-input">
                            <CalendarDays size={18} />

                            <input
                                id="fecha_compra"
                                name="fecha_compra"
                                type="date"
                                value={form.fecha_compra}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Cuotas */}
                    <div className="form-group">
                        <label htmlFor="numero_cuotas">
                            Número de cuotas
                        </label>

                        <div className="form-input">
                            <Layers3 size={18} />

                            <input
                                id="numero_cuotas"
                                name="numero_cuotas"
                                type="number"
                                min="1"
                                value={form.numero_cuotas}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Tipo */}
                    <div className="form-group">
                        <label htmlFor="tipo">
                            Tipo de gasto
                        </label>

                        <div className="form-input">
                            <CreditCard size={18} />

                            <select
                                id="tipo"
                                name="tipo"
                                value={form.tipo}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Selecciona un tipo
                                </option>

                                {tipos.map(tipo => (
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
                    disabled={loading}
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
                        <>
                            Registrar compra
                        </>
                    )}
                </button>

            </div>

        </>
    );
}

export default FormAddCompra;