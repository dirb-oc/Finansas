import { apiGet } from "../Services/api";

export function getTipos() {
  return apiGet("/tipos/");
}

export async function getTiposGasto() {
    const tipos = await getTipos();

    return tipos.filter(
        tipo => tipo.tipo === "gasto"
    );
}