import { apiGet } from "../Services/api";

export function getTipos() {
  return apiGet("/tipos/");
}