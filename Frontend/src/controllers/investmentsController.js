import { apiGet, apiPost } from "../Services/api";

export async function getStatsInversiones() {
  return await apiGet("/pruebas/stats");
}

export async function getCDTs() {
  return await apiGet("/pruebas/CDTstats");
}

export async function createCDT(data) {
  return apiPost("/pruebas/cdt/", data);
}

export async function finalizarCDT(id, data) {
  return apiPost(`/pruebas/cdt/${id}/finalizar/`, data);
}

export async function getassets() {
  return await apiGet("/pruebas/assetsstats");
}



export async function getInversiones() {
  return await apiGet("/inversiones/");
}

export async function getResumenInversiones() {
  return await apiGet("/resumen-inv/");
}

export async function createInversion(data) {
  return apiPost("/inversiones/", data);
}

export async function finalizarInversion(id, data) {
  return apiPost(`/inversiones/${id}/finalizar/`, data);
}