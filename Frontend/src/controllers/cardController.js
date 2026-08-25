import { apiGet, apiPost } from "../Services/api";

export async function getCardById(id) {
    return await apiGet(`/TarjetaCredito/${id}/`);
}

export async function postCompra(id) {
    return await apiPost(`/TarjetaCredito/${id}/`);
}