import { apiGet, apiPost } from "../Services/api";

export async function getInversiones() {
  return await apiGet("/inversiones/");
}

export async function createInversion(data) {
  return apiPost("/inversiones/", data);
}

export async function finalizarInversion(id, data) {
  return apiPost(`/inversiones/${id}/finalizar/`, data);
}