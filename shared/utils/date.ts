export function toTimestamp(dateLike: string | null): number {
  if (!dateLike) return 0;
  const parsed = Date.parse(dateLike);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatDate(dateLike: string | null): string {
  if (!dateLike) return "Data nao informada";

  const parsed = Date.parse(dateLike);
  if (Number.isNaN(parsed)) return "Data invalida";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}
