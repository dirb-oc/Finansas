import { WalletCards, Landmark, Banknote, PiggyBank, Wallet, Coins, } from "lucide-react";
import { Link } from "react-router-dom";
import formatCOP from "../../Services/utils";
import "./Accounts.css";

const COLORS = ["#3b82f6", "#3b82f6", "#3b82f6", "#333333", "#222222",];
const ACCOUNT_ICONS = [Wallet, Banknote, Landmark,PiggyBank, WalletCards, Coins,];

export default function Accounts({ data }) {

    return (
        <div className="chart-card">

            <div className="chart-header">
                <h3>Cuentas y Distribución</h3>

                <span>
                    {data.cuentas.length} Cuentas · {" "}
                    {formatCOP(data.disponible)}
                </span>
            </div>

            <div className="accounts-list">

                {data.cuentas.map((cuenta, index) => {

                    const color = COLORS[index % COLORS.length];
                    const Icon = ACCOUNT_ICONS[index % ACCOUNT_ICONS.length];

                    return (
                        <Link to={`/cuentas/${cuenta.id}`} className="account-item" key={cuenta.id} >

                            <div className="account-top">

                                <div
                                    className="account-icon"
                                    style={{ color }}
                                >
                                    <Icon size={23} />
                                </div>

                                <span className="account-name">
                                    {cuenta.nombre}
                                </span>

                                <span className="account-percent">
                                    {cuenta.porcentaje}%
                                </span>

                                <span className="account-money">
                                    {formatCOP(cuenta.saldo)}
                                </span>

                            </div>

                            <div className="account-progress">
                                <div
                                    className="account-progress__value"
                                    style={{
                                        width: `${cuenta.porcentaje}%`,
                                        background: "var(--accent-blue)",
                                    }}
                                />
                            </div>

                        </Link>
                    );
                })}

            </div>

        </div>
    );
}