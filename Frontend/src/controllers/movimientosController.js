import { apiPost, apiPut } from "../Services/api";

export function createMovimiento(data) {
    return apiPost("/movimientos/", data);
}

export function updateMovimiento(id, data) {
    return apiPut(`/movimientos/${id}/`, data);
}
