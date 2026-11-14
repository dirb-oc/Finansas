
import DonutChart from "../Stats/DonutChart";
import "./AccountCategory.css"

export default function AccountCategory({ impacto = {} }) {
    const gastos = (impacto.gastos || []).map(item => ({
        name: item.nombre,
        value: Number(item.total),
    }));

    const ingresos = (impacto.ingresos || []).map(item => ({
        name: item.nombre,
        value: Number(item.total),
    }));

    return (
        <div className="account-category">
            <div className="account-category__item">

                <DonutChart
                    data={gastos}
                    type="gastos"
                    compact
                />
            </div>

            <div className="account-category__item">

                <DonutChart
                    data={ingresos}
                    type="ingresos"
                    compact
                />
            </div>
        </div>
    );
}