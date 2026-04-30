import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCuentas } from "../controllers/cuentasController";
import { Landmark } from "lucide-react";
import CreateCuentaModal from "../Components/CreateCuentaModal";
import formatCOP from "../Services/utils";
import "../Components/Cuentas.css";

export default function Cuentas() {
    const [cuentas, setCuentas] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { cargarCuentas(); }, []);

    async function cargarCuentas() {
        const data = await getCuentas();
        setCuentas(data);
    }

    const total = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0);

    return (
        <div className="General">
            <h2>Cuentas</h2>

            <div className="header">
                <p className="total">
                    Total: <span>{formatCOP(total)}</span>
                </p>

                <button
                    className="btn-primary"
                    onClick={() => setOpenModal(true)}
                >
                    Nueva cuenta
                </button>
            </div>

            <CreateCuentaModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onCreated={cargarCuentas}
            />

            {/* LIST */}
            <div className="cuentas-list">
                {cuentas.map((c) => (
                    <div
                        key={c.id}
                        className="cuenta-row"
                        onClick={() => navigate(`/cuentas/${c.id}`)}
                    >
                        <div className="cuenta-info">
                            <div className="icono"><Landmark size={20} /></div>
                            <div className="nombre">{c.nombre}</div>
                        </div>

                        <div className="balance">
                            {formatCOP(c.saldo)}
                        </div>

                        <div className="progress-container">
                            <div className="barra">
                                <div
                                    className="barra-fill"
                                    style={{ width: `${c.porcentaje_disponible}%` }}
                                />
                            </div>
                            <span>{c.porcentaje_disponible}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}