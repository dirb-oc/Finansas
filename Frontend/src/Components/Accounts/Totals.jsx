import { Wallet, TrendingUp, TrendingDown, Activity, } from "lucide-react";
import formatCOP from "../../Services/utils";
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

    {/* =================================================
        HEADER
    ================================================= */}

    <header className="account-summary__header">

        <div className="account-summary__identity">

            <div className="account-summary__icon">
                <Wallet size={28} strokeWidth={1.8} />
            </div>

            <div className="account-summary__identity-info">

                <span className="account-summary__label">
                    Cuenta bancaria
                </span>

                <h2>{cuenta.nombre}</h2>

            </div>

        </div>

        <span className="account-summary__month">
            {cuenta.mes_resumen}
        </span>

    </header>


    {/* =================================================
        CONTENT
    ================================================= */}

    <div className="account-summary__content">

        {/* SALDO PRINCIPAL */}

        <div className="account-summary__balance">

            <span className="account-summary__balance-label">
                Saldo disponible
            </span>

            <strong>
                {formatCOP(saldo)}
            </strong>

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

        <div className="account-summary__stats">

            <div className="account-summary__stat">

                <div className="account-summary__stat-icon income">
                    <TrendingUp size={19} />
                </div>

                <div className="account-summary__stat-content">

                    <span>Ingresos del mes</span>

                    <strong className="income">
                        +{formatCOP(ingresos)}
                    </strong>

                </div>

            </div>


            <div className="account-summary__stat">

                <div className="account-summary__stat-icon expense">
                    <TrendingDown size={19} />
                </div>

                <div className="account-summary__stat-content">

                    <span>Gastos del mes</span>

                    <strong className="expense">
                        -{formatCOP(gastos)}
                    </strong>

                </div>

            </div>


            <div className="account-summary__stat">

                <div className="account-summary__stat-icon balance">
                    <Activity size={19} />
                </div>

                <div className="account-summary__stat-content">

                    <span>Movimiento neto</span>

                    <strong className={balanceClass}>
                        {balance > 0 ? "+" : ""}
                        {formatCOP(balance)}
                    </strong>

                </div>

            </div>

        </div>

    </div>

</section>
    );
}