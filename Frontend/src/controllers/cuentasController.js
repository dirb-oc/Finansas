import { apiGet, apiPost} from "../Services/api";

export async function getCuentas() {
    return await apiGet("/cuentas/");
}

export async function getCuentaById(id) {
    return await apiGet(`/cuentas/${id}/`);
}

export function createCuenta(data) {
  return apiPost("/cuentas/", data);
}