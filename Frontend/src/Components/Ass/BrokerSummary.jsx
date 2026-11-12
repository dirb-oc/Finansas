
import { Landmark } from "lucide-react";
import formatCOP, { formatMoney, formatExpiration } from "../../Services/utils";

export default function BrokerSummary({ broker, onCotizacion }) {
    return (
        <aside className="broker-summary">
            <div className="broker-summary-header">
                <div className="broker-avatar">
                    <Landmark size={23} />
                </div>

                <div>
                    <h3>{broker.broker}</h3>
                    <span>
                        Cuenta de inversión · {broker.moneda}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onCotizacion}
                >
                    Cotización
                </button>
            </div>

            <div className="broker-stats">
                <div className="broker-stat">
                    <span>Patrimonio total</span>
                    <strong>
                        {formatMoney(broker.patrimonio, broker.moneda)}
                    </strong>
                </div>

                <div className="broker-stat">
                    <span>Saldo disponible</span>
                    <strong>
                        {formatMoney(broker.saldo_disponible, broker.moneda)}
                    </strong>
                </div>

                <div className="broker-stat">
                    <span>Valor invertido</span>
                    <strong>
                        {formatMoney(broker.valor_invertido, broker.moneda)}
                    </strong>
                </div>
            </div>

            <div className="broker-cop">
                <div className="broker-cop-value">
                    <span>Patrimonio equivalente en COP</span>
                    <strong>
                        {formatCOP(broker.patrimonio_cop)}
                    </strong>
                </div>

                <div className="broker-exchange-rate">
                    <span>Tasa {broker.moneda}/COP</span>
                    <strong>
                        {formatCOP(broker.tasa_cop)}
                    </strong>
                </div>
            </div>
        </aside>
    );
}
