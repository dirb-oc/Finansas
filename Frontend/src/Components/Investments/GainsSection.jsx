import { TrendingUp } from "lucide-react";
import { formatPercentage, formatSigned } from "../../Services/utils";
import "./GainsSection.css";

export default function GainsSection({ ganancia, rentabilidadTotal, gananciaSobrePatrimonio, }) {

    const gananciaTotal = Number(ganancia?.total) || 0;
    const gananciaRealizada = Number(ganancia?.realizada) || 0;
    const gananciaNoRealizada = Number(ganancia?.no_realizada) || 0;

    const porRealizada = gananciaTotal > 0 ? Math.round((gananciaRealizada / gananciaTotal) * 100) : 0;
    const porNoRealizada = gananciaTotal > 0 ? Math.round((gananciaNoRealizada / gananciaTotal) * 100) : 0;

    const yields = [
        {
            title: "Rentabilidad del capital",
            value: formatPercentage(rentabilidadTotal),
            positivo: Number(rentabilidadTotal) >= 0,
        },
        {
            title: "Ganancia sobre patrimonio",
            value: formatPercentage(gananciaSobrePatrimonio),
            positivo: Number(gananciaSobrePatrimonio) >= 0,
        },
    ];

    return (
        <section className="gains-section">

            <section className="gains-section-totals" aria-label="Ganancias de tus inversiones">

                <div className="gains-section__header">
                    <div>
                        <h3>Ganancias Totales</h3>
                        <span>Resultado Neto</span>
                    </div>

                </div>

                <span className="gains-total">{formatSigned(gananciaTotal)}</span>

                <div className={"gain-label "}>
                    <div className="gain-performance__label">
                        <TrendingUp size={21} />
                        <span>Ganancia Realizada</span>
                    </div>

                    <strong className={`${gananciaRealizada >= 0 ? "increase" : "decrement"}`}>{formatSigned(gananciaRealizada)}</strong>
                </div>

                <div className={"gain-label"}>
                    <div className="gain-performance__label">
                        <TrendingUp size={21} />
                        <span>Ganancia No Realizada</span>
                    </div>

                    <strong className={`${gananciaNoRealizada >= 0 ? "increase" : "decrement"}`}>{formatSigned(gananciaNoRealizada)}</strong>
                </div>

            </section>

            <div className="gains-section-bar">
                <div className="gains-section__header">
                    <div>
                        <h3>Aporte al resultado neto</h3>
                        <span>Porcentaje sobre la ganancia neta</span>
                    </div>

                </div>

                <div className="gains-section__bar-track">
                    <div
                        className="gains-section__bar-fill realized"
                        style={{ width: `${Math.max(0, porRealizada)}%` }}
                    />
                    <div
                        className="gains-section__bar-fill unrealized"
                        style={{ width: `${Math.max(0, porNoRealizada)}%` }}
                    />
                </div>

                <div className="gains-section__bar-legend">
                    <span className="is-realized">
                        <i /> Realizada {porRealizada}%
                    </span>
                    <span className="is-unrealized">
                        <i /> No realizada {porNoRealizada}%
                    </span>
                </div>


                <div className="gains-section__yields">

                    {yields.map((item) => (
                        <div
                            key={item.title}
                            className={[
                                "gains-section__yield",
                                item.positivo ? "is-positive" : "is-negative",
                            ].join(" ")}
                        >
                            <span>{item.title}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}

                </div>

            </div>
        </section>

    );
}