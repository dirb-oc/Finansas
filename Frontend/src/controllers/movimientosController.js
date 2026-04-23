import { apiPost } from "../Services/api";

export function createMovimiento(data) {
  return apiPost("/movimientos/", data);
}
