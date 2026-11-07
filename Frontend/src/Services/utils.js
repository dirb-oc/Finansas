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

    const datePart = date.split("T")[0];
    const [year, month, day] = datePart.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));

    return localDate.toLocaleDateString("es-CO", { day: "2-digit", month: "short", });
}

export function formatExpiration(date) {
    if (!date) return "Sin fecha";

    const [year, month, day] = date.split("-").map(Number);

    const nombreMes = new Intl.DateTimeFormat("es-CO", {
        month: "short",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));

    return `${day} ${nombreMes.replace(".", "")} ${String(year).slice(-2)}`;
}

export const formatPercentage = (value) => {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    return `${Number(value).toLocaleString("es-CO", {
        maximumFractionDigits: 2,
    })}%`;
};

export const formatNumber = (value) => {
    return new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 2,
    }).format(value ?? 0);
};

export const handleFormattedPriceChange = (e,setForm,fieldName) => {
    const raw = e.target.value.replace(/\D/g, "");

    const formatted = Number(raw).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    });

    setForm(prev => ({
        ...prev,
        [`${fieldName}Formatted`]: formatted,
        [fieldName]: raw,
    }));
};

export const getToday = () => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };
