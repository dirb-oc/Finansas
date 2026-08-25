import formatCOP from "../../Services/utils";
import { Link } from "react-router-dom";
import "./ExpensesCategory.css";

export default function ExpensesCategory({ categorias }) {

    const total = categorias.reduce(
        (sum, categoria) => sum + categoria.monto,
        0
    );

    return (
        <div className="chart-card Investment">

            <h3>
                Distribución de <Link to="/movimientos/">gastos</Link>
            </h3>

            <span>Categorias {categorias.length} · {formatCOP(total)}</span>

            <div className="investment-list">

                {categorias.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-icon">💸</div>

                        <h4>No hay gastos este mes</h4>

                        <p>
                            Cuando registres gastos aparecerán aquí.
                        </p>

                    </div>

                ) : (

                    categorias.map((categoria) => {

                        const porcentaje =
                            total === 0
                                ? 0
                                : (categoria.monto / total) * 100;

                        return (

                            <div
                                key={categoria.nombre}
                                className="investment-item"
                            >

                                <div className="investment-info">

                                    <span className="investment-name">
                                        {categoria.nombre}
                                    </span>

                                    <span className="investment-money">
                                        {formatCOP(categoria.monto)}
                                    </span>

                                </div>

                                <div className="investment-progress">

                                    <div className="progress-bar">

                                        <div
                                            className="progress-fill_investment"
                                            style={{
                                                width: `${porcentaje}%`
                                            }}
                                        />

                                    </div>

                                    <span className="investment-percent">
                                        {porcentaje.toFixed(1)}%
                                    </span>

                                </div>

                            </div>

                        );

                    })

                )}

            </div>

        </div>
    );
}