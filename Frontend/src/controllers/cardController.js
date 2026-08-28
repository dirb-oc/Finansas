import { apiGet, apiPost } from "../Services/api";

export async function getCardById(id) {
    return await apiGet(`/TarjetaCredito/${id}/`);
}

export async function CreateCompra(data) {
    return await apiPost("/ComprasCredito/", data);
}

export async function CreatePago(data) {
    return await apiPost("/PagoCredito/", data);
}

export async function getComprasPendientes() {
    const response = await apiGet("/ComprasCredito/");

    return response.filter(compra => compra.estado !== "saldada");
}
