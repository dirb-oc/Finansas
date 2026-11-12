import BrokerSummary from "./BrokerSummary";
import BrokerActivity from "./BrokerActivity";
import "./BrokerSection.css";

export default function BrokerSection({
    brokers = [],
    historial = {},
    onCreateOperacion,
    onCreateMovimiento,
    onCotizacion,
}) {
    const broker = brokers[0];

    if (!broker) return null;

    const movimientos = (historial.movimientos || []).filter(
        (item) => item.broker_id === broker.broker_id
    );

    const operaciones = (historial.operaciones || []).filter(
        (item) => item.broker_id === broker.broker_id
    );

    return (
        <>
            <div className="heading">
                <div>
                    <h2>Broker</h2>
                    <p>Posiciones actuales de tu portafolio</p>
                </div>
            </div>

            <section className="broker-section">
                <div className="broker-panel">
                    <BrokerSummary
                        broker={broker}
                        onCotizacion={onCotizacion}
                    />

                    <BrokerActivity
                        operaciones={operaciones}
                        movimientos={movimientos}
                        onCreateOperacion={onCreateOperacion}
                        onCreateMovimiento={onCreateMovimiento}
                    />
                </div>
            </section>
        </>
    );
}
