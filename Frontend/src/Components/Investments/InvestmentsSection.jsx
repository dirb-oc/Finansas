import "./InvestmentsSection.css";

export default function InvestmentsSection({ label, title, icon, tone = "blue", count, children }) {
    return (
        <section className={`invest-panel invest-panel--${tone}`}>
            <div className="invest-panel__header">
                <div className="invest-panel__heading">
                    {icon && (
                        <span className="invest-panel__icon">{icon}</span>
                    )}

                    <div className="invest-panel__title">
                        <span className="invest-panel__label">{label}</span>
                        <h3>{title}</h3>
                    </div>
                </div>

                {count != null && (
                    <span className="invest-panel__count">{count}</span>
                )}
            </div>

            <div className="invest-panel__body">
                {children}
            </div>
        </section>
    );
}