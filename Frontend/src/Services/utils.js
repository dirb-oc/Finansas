// Services/utils.js
export default function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(value || 0);
}

export function formatDate(date) {
    if (!date) return "--";

    const [year, month, day] = date.split("-");

    const localDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return localDate.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
    });
}