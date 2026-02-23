"use client";

import api from "@/lib/api";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { toTimestamp, formatDate } from "@/shared/utils/date";

type Order = Record<string, unknown>;

function getOrderCreatedAt(order: Order): string | null {
  const candidates = [
    order.createdAt ?? null,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function getOrderLabel(order: Order): string {
  const candidates = [order.pedido, order.order, order.descricao, order.description];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return "Pedido sem descricao";
}

function getCustomerName(order: Order): string {
  const candidates = [order.nome];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return "Cliente nao informado";
}

function getOrderId(order: Order, index: number): string {
  const candidates = [order.id, order._id, order.uuid];

  for (const value of candidates) {
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  return `order-${index}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data } = await api.get("/order-solicitation");
        const payload = data as {
          data?: unknown;
          order?: unknown;
          orders?: unknown;
        };

        const list = Array.isArray(data)
          ? (data as Order[])
          : Array.isArray(payload.order)
            ? (payload.order as Order[])
            : Array.isArray(payload.orders)
              ? (payload.orders as Order[])
              : Array.isArray(payload.data)
                ? (payload.data as Order[])
                : [];

        if (!isMounted) return;
        setOrders(list);
      } catch (error) {
        if (!isMounted) return;
        const axiosError = error as AxiosError<{ message?: string }>;
        setErrorMessage(
          axiosError.response?.data?.message ??
          "Nao foi possivel carregar os pedidos."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => toTimestamp(getOrderCreatedAt(b)) - toTimestamp(getOrderCreatedAt(a)))
      .slice(0, 10);
  }, [orders]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Ultimos pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mostrando os 10 pedidos mais recentes criados.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {isLoading && <p className="text-sm text-slate-600">Carregando pedidos...</p>}

          {!isLoading && errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {!isLoading && !errorMessage && latestOrders.length === 0 && (
            <p className="text-sm text-slate-600">Nenhum pedido encontrado.</p>
          )}

          {!isLoading && !errorMessage && latestOrders.length > 0 && (
            <ul className="space-y-3">
              {latestOrders.map((order, index) => {
                const createdAt = getOrderCreatedAt(order);

                return (
                  <li
                    key={getOrderId(order, index)}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getCustomerName(order)}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{getOrderLabel(order)}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
