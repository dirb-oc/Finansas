import { apiGet } from "../Services/api";

export async function getStats() {
  return await apiGet("/stats/");
}