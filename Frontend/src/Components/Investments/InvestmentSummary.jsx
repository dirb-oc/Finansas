import { Landmark, PiggyBank, TrendingUp, Percent } from "lucide-react";
import formatCOP, { formatPercentage, formatSigned } from "../../Services/utils";
import SummaryCards from "../SummaryCards";

export default function InvestmentSummary({ patrimonio, cantidadInvertida, ganancia, rentabilidadTotal, }) {
    const gananciaTotal = Number(ganancia?.total) || 0;

    const cards = [
        {
            key: "patrimonio",
            title: "Patrimonio",
            icon: <Landmark size={20} />,
            value: formatCOP(patrimonio),
        },
        {
            key: "invertido",
            title: "Invertido",
            icon: <PiggyBank size={20} />,
            value: formatCOP(cantidadInvertida),
        },
        {
            key: "ganancia",
            title: "Ganancia total",
            icon: <TrendingUp size={20} />,
            value: formatSigned(gananciaTotal),
            negative: gananciaTotal < 0,
        },
        {
            key: "rentabilidad",
            title: "Rentabilidad",
            icon: <Percent size={20} />,
            value: formatPercentage(rentabilidadTotal),
            negative: Number(rentabilidadTotal) < 0,
        },
    ];

    return (
        <SummaryCards
            cards={cards}
            ariaLabel="Resumen de inversiones"
        />
    );
}