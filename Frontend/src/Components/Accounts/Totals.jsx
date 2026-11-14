import { Wallet, TrendingUp, TrendingDown, Activity, } from "lucide-react";
import formatCOP from "../../Services/utils";
import AccountCategory from "./AccountCategory";
import "./Totals.css";

export default function Totals({ cuenta }) {

    const ingresos = Number(cuenta.ingresos_total) || 0;
    const gastos = Number(cuenta.gastos_total) || 0;
    const saldo = Number(cuenta.saldo) || 0;

    const balance = ingresos - gastos;

    const balanceClass =
        balance > 0
            ? "income"
            : balance < 0
                ? "expense"
                : "neutral";

    return (
        <section className="account-summary">
            <div className="account-content">

                {/* SALDO PRINCIPAL */}

                <div className="account-summary__identity">

                    <div className="account-summary__icon">
                        <Wallet size={28} strokeWidth={1.8} />
                    </div>

                    <div className="account-summary__identity-info">

                        <span className="account-summary__label">Cuenta bancaria</span>
                        <h2>{cuenta.nombre}</h2>

                    </div>

                </div>
                <div className="account-summary__balance">

                    <span className="account-summary__balance-label">Saldo disponible</span>
                    <strong>{formatCOP(saldo)}</strong>

                    <div className={`account-summary__balance-status ${balanceClass}`}>

                        <Activity size={15} />

                        <span>
                            {balance > 0
                                ? "Balance positivo este mes"
                                : balance < 0
                                    ? "Balance negativo este mes"
                                    : "Balance neutro este mes"
                            }
                        </span>

                        <strong>
                            {balance > 0 ? "+" : ""}
                            {formatCOP(balance)}
                        </strong>

                    </div>


                </div>
            </div>

            <AccountCategory impacto={cuenta.impacto} />

        </section>
    );
}