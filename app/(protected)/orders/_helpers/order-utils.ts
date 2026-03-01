export type Order = Record<string, unknown>;

export function getOrderCreatedAt(order: Order): string | null {
  const candidates = [order.createdAt ?? null];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

export function getOrderLabel(order: Order): string {
  const candidates = [order.pedido, order.order, order.descricao, order.description];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return "Pedido sem descricao";
}

export function getCustomerName(order: Order): string {
  const candidates = [order.nome];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return "Cliente nao informado";
}

export function getOrderId(order: Order, index: number): string {
  const candidates = [order.id, order._id, order.uuid];
  for (const value of candidates) {
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return `order-${index}`;
}

export function isNewOrder(createdAt: string | null, windowMinutes = 15): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;

  const now = Date.now();
  const diffMs = now - created;
  return diffMs >= 0 && diffMs <= windowMinutes * 60 * 1000;
}
