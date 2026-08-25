import { getCuentaById } from "../controllers/cuentasController";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Totals from "../Components/Accounts/Totals"
import ActivityAccount from "../Components/Accounts/ActivityAccount"

export default function AccountDetaild() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cuenta, setCuenta] = useState(null);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        getCuentaById(id).then(setCuenta);
    }, [id, refresh]);

    if (!cuenta) {
        return <p className="loading">Cargando...</p>;
    }

    return (
        <div className="General account-detail">

            <h1 className="title">Mi Cuenta</h1>

            <p className="subtitle card-detail__back" onClick={() => navigate(-1)} >
                <ArrowLeft size={18} />
                <span>Volver</span>
            </p>

            <div className="divisor" />

            <Totals cuenta={cuenta} />
            <ActivityAccount cuenta={cuenta} />

        </div>
    );
}