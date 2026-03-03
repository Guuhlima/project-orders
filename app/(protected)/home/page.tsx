"use client";

import api from "@/lib/api";
import Button from "@/shared/components/Button";
import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
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

export default function HomeOrderPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"balcao" | "mercado_pago">(
    "balcao"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [observations, setObservations] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, number>
  >({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsErrorMessage, setProductsErrorMessage] = useState<string | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    if (status === "success") {
      router.push("/orders/success");
    }
  }, [status, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setProductsErrorMessage(null);

      try {
        const { data } = await api.get("/products");
        const parsedProducts = extractProducts(data);

        if (!isMounted) return;
        setProducts(parsedProducts);
      } catch (error) {
        if (!isMounted) return;
        const axiosError = error as AxiosError<{ message?: string }>;
        setProductsErrorMessage(
          axiosError.response?.data?.message ??
            "Nao foi possivel carregar os produtos."
        );
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedItems = useMemo(() => {
    return products
      .map((product) => ({
        product,
        quantity: selectedProducts[product.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);
  }, [products, selectedProducts]);

  const pedidoText = useMemo(() => {
    if (selectedItems.length === 0) return "";

    return selectedItems
      .map((item) => `${item.quantity}x ${item.product.name}`)
      .join(", ");
  }, [selectedItems]);

  const totalValue = useMemo(() => {
    return selectedItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }, [selectedItems]);

  const selectedItemsCount = useMemo(() => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  }, [selectedItems]);

  const totalValueDisplay = totalValue > 0 ? totalValue.toFixed(2) : "";

  function updateProductQuantity(productId: string, nextQuantity: number) {
    const safeQuantity = Math.max(0, nextQuantity);

    setSelectedProducts((previous) => {
      const next = { ...previous };

      if (safeQuantity === 0) {
        delete next[productId];
        return next;
      }

      next[productId] = safeQuantity;
      return next;
    });
  }

  function handlePaymentMethodChange(value: string) {
    if (value === "balcao" || value === "mercado_pago") {
      setPaymentMethod(value);
    }
  }

  function handleContinueToDetails() {
    setStatus(null);
    if (selectedItems.length === 0) {
      setStatus("error");
      setErrorMessage("Selecione pelo menos um produto para continuar.");
      return;
    }

    setErrorMessage(null);
    setCurrentStep(2);
  }

  function handleBackToProducts() {
    setErrorMessage(null);
    setCurrentStep(1);
  }

  function extractCheckoutUrl(responseData: unknown): string | null {
    if (!responseData || typeof responseData !== "object") return null;

    const source = responseData as Record<string, unknown>;
    const nested =
      source.data && typeof source.data === "object"
        ? (source.data as Record<string, unknown>)
        : null;
    const payment =
      source.payment && typeof source.payment === "object"
        ? (source.payment as Record<string, unknown>)
        : null;
    const nestedPayment =
      nested?.payment && typeof nested.payment === "object"
        ? (nested.payment as Record<string, unknown>)
        : null;

    const candidate =
      payment?.checkoutUrl ??
      payment?.sandboxCheckoutUrl ??
      nestedPayment?.checkoutUrl ??
      nestedPayment?.sandboxCheckoutUrl ??
      source.init_point ??
      source.sandbox_init_point ??
      source.checkout_url ??
      source.url ??
      nested?.init_point ??
      nested?.sandbox_init_point ??
      nested?.checkout_url ??
      nested?.url;

    return typeof candidate === "string" && candidate.startsWith("http")
      ? candidate
      : null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setErrorMessage(null);

    if (selectedItems.length === 0) {
      setStatus("error");
      setErrorMessage("Selecione pelo menos um produto para continuar.");
      setIsSubmitting(false);
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setStatus("error");
      setErrorMessage("Informe nome e telefone para concluir o pedido.");
      setIsSubmitting(false);
      return;
    }

    const payload: Record<string, string> = {
      nome: trimmedName,
      telefone: trimmedPhone,
      observacoes: observations.trim(),
      payment: paymentMethod,
      paymaent: paymentMethod,
      pedido: pedidoText,
      valor: totalValue.toFixed(2),
    };

    try {
      if (paymentMethod === "mercado_pago") {
        const { data } = await api.post("/order-solicitation", payload);
        const checkoutUrl = extractCheckoutUrl(data);

        if (!checkoutUrl) {
          setStatus("error");
          setErrorMessage(
            "A API nao retornou a URL de pagamento. Verifique o retorno do backend."
          );
          return;
        }

        window.location.href = checkoutUrl;
        return;
      }

      await api.post("/order-solicitation", payload);
      setStatus("success");
      setSelectedProducts({});
      setCustomerName("");
      setCustomerPhone("");
      setObservations("");
      setPaymentMethod("balcao");
      setCurrentStep(1);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message ?? "Erro ao enviar. Tente novamente."
      );
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Faca seu pedido</h1>
            <p className="mt-2 text-sm text-slate-500">
              Fluxo em 2 etapas para facilitar o preenchimento.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                currentStep === 1
                  ? "bg-violet-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              1
            </span>
            <p className="text-xs text-slate-600">Selecionar produtos</p>
            <span className="text-slate-400">/</span>
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                currentStep === 2
                  ? "bg-violet-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              2
            </span>
            <p className="text-xs text-slate-600">Dados e pagamento</p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Produtos
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedItemsCount} item(ns)
                    </span>
                  </div>

                  {isLoadingProducts && (
                    <p className="mt-2 text-sm text-slate-500">
                      Carregando produtos...
                    </p>
                  )}

                  {!isLoadingProducts && productsErrorMessage && (
                    <p className="mt-2 text-sm text-red-600">
                      {productsErrorMessage}
                    </p>
                  )}

                  {!isLoadingProducts &&
                    !productsErrorMessage &&
                    products.length === 0 && (
                      <p className="mt-2 text-sm text-slate-500">
                        Nenhum produto encontrado.
                      </p>
                    )}

                  {!isLoadingProducts &&
                    !productsErrorMessage &&
                    products.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {products.map((product) => {
                          const quantity = selectedProducts[product.id] ?? 0;

                          return (
                            <li
                              key={product.id}
                              className="rounded-lg border border-slate-200 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    R$ {product.price.toFixed(2)}
                                  </p>
                                  {product.description && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {product.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-md border border-slate-300 text-slate-700"
                                    onClick={() =>
                                      updateProductQuantity(
                                        product.id,
                                        quantity - 1
                                      )
                                    }
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-md border border-slate-300 text-slate-700"
                                    onClick={() =>
                                      updateProductQuantity(
                                        product.id,
                                        quantity + 1
                                      )
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Resumo do pedido
                  </span>
                  <textarea
                    rows={3}
                    value={pedidoText || "Selecione os produtos acima."}
                    readOnly
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Valor total (R$)
                  </span>
                  <input
                    type="number"
                    value={totalValueDisplay}
                    step="0.01"
                    placeholder="0.00"
                    readOnly
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>

                <Button
                  type="button"
                  className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  onClick={handleContinueToDetails}
                  disabled={isLoadingProducts}
                >
                  Continuar para dados e pagamento
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Pedido selecionado
                  </span>
                  <textarea
                    rows={3}
                    value={pedidoText}
                    readOnly
                    className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Valor total (R$)
                  </span>
                  <input
                    type="number"
                    value={totalValueDisplay}
                    step="0.01"
                    readOnly
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Nome
                    </span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Seu nome"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Telefone
                    </span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="(00) 00000-0000"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Observacoes
                  </span>
                  <input
                    type="text"
                    value={observations}
                    onChange={(event) => setObservations(event.target.value)}
                    placeholder="Sem cebola, ponto da carne, etc."
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Forma de pagamento
                  </span>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-slate-300">
                      <input
                        type="radio"
                        name="payment"
                        className="mt-1 h-4 w-4"
                        checked={paymentMethod === "balcao"}
                        onChange={(event) =>
                          handlePaymentMethodChange(event.target.value)
                        }
                        value="balcao"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          Pagar no balcao
                        </span>
                        <span className="block text-xs text-slate-500">
                          Pagamento presencial na retirada.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-slate-300">
                      <input
                        type="radio"
                        name="payment"
                        className="mt-1 h-4 w-4"
                        checked={paymentMethod === "mercado_pago"}
                        onChange={(event) =>
                          handlePaymentMethodChange(event.target.value)
                        }
                        value="mercado_pago"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          Mercado Pago
                        </span>
                        <span className="block text-xs text-slate-500">
                          Pague online e confirme seu pedido.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold"
                    onClick={handleBackToProducts}
                    disabled={isSubmitting}
                  >
                    Voltar para produtos
                  </Button>
                  <Button
                    type="submit"
                    className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar pedido"}
                  </Button>
                </div>
              </>
            )}

            {status === "error" && (
              <p className="text-center text-sm text-red-600">
                {errorMessage ?? "Erro ao enviar. Tente novamente."}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
