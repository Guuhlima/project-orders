"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import api, { AUTH_TOKEN_KEY } from "@/lib/api";
import Button from "@/shared/components/Button";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    if (Number.isFinite(normalized)) return normalized;
  }

  return 0;
}

function normalizeProduct(source: unknown, index: number): Product | null {
  if (!source || typeof source !== "object") return null;

  const payload = source as Record<string, unknown>;
  const idCandidate = payload.id ?? payload._id ?? payload.uuid;
  const nameCandidate = payload.name ?? payload.nome;

  if (typeof nameCandidate !== "string" || nameCandidate.trim().length === 0) {
    return null;
  }

  return {
    id:
      typeof idCandidate === "string" || typeof idCandidate === "number"
        ? String(idCandidate)
        : `product-${index}`,
    name: nameCandidate.trim(),
    price: toNumber(payload.price ?? payload.preco ?? payload.valor),
    description:
      typeof payload.description === "string"
        ? payload.description
        : typeof payload.descricao === "string"
          ? payload.descricao
          : "",
  };
}

function extractProducts(data: unknown): Product[] {
  const source = data as
    | unknown[]
    | {
        data?: unknown;
        product?: unknown;
        products?: unknown;
      };

  const list = Array.isArray(source)
    ? source
    : Array.isArray(source.products)
      ? source.products
      : Array.isArray(source.product)
        ? source.product
      : Array.isArray(source.data)
        ? source.data
        : [];

  return list
    .map((item, index) => normalizeProduct(item, index))
    .filter((item): item is Product => item !== null);
}

export default function ConfigPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data } = await api.get("/products");
        setProducts(extractProducts(data));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setErrorMessage(
          axiosError.response?.data?.message ??
            "Nao foi possivel carregar os produtos."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
    };

    if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0) {
      setErrorMessage("Informe nome e preco valido para cadastrar o produto.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data } = await api.post("/products", payload);
      const created =
        normalizeProduct(data, 0) ??
        normalizeProduct((data as { product?: unknown })?.product, 0) ??
        normalizeProduct((data as { data?: unknown })?.data, 0);

      if (created) {
        setProducts((previous) => [created, ...previous]);
      }

      setName("");
      setPrice("");
      setDescription("");
      setFeedbackMessage("Produto salvo com sucesso.");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message ??
          "Nao foi possivel salvar o produto."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Configuracao de produtos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre os produtos que voce quer disponibilizar.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Novo produto</h2>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: X-Burger"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Preco (R$)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Descricao
              </span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descricao opcional"
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <Button
              type="submit"
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar produto"}
            </Button>
          </form>

          {feedbackMessage && (
            <p className="mt-3 text-sm text-emerald-600">{feedbackMessage}</p>
          )}
          {errorMessage && (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Produtos cadastrados</h2>

          {isLoading && (
            <p className="mt-4 text-sm text-slate-500">Carregando produtos...</p>
          )}

          {!isLoading && products.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum produto encontrado.
            </p>
          )}

          {!isLoading && products.length > 0 && (
            <ul className="mt-4 space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm font-semibold text-slate-700">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  {product.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {product.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
