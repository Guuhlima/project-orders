"use client";

import api from "@/lib/api";
import Button from "@/shared/components/Button";
import { AxiosError } from "axios";
import { useState } from "react";

export default function HomeOrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("balcao");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const selectedPayment = payload.payment ?? payload.paymaent;
    payload.payment = selectedPayment;
    payload.paymaent = selectedPayment;

    try {
      if (selectedPayment === "mercado_pago") {
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
      form.reset();
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
              Informe o que voce deseja e escolha a forma de pagamento.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Nome</span>
                <input
                  type="text"
                  name="nome"
                  placeholder="Seu nome"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Telefone</span>
                <input
                  type="tel"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Pedido</span>
              <textarea
                rows={4}
                name="pedido"
                placeholder="Ex: 2 hamburgueres, 1 batata media, 1 refrigerante..."
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Observacoes</span>
              <input
                type="text"
                name="observacoes"
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
                    onChange={(event) => setPaymentMethod(event.target.value)}
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
                    onChange={(event) => setPaymentMethod(event.target.value)}
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

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Valor (R$)</span>
              <input
                type="number"
                name="valor"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                required={paymentMethod === "mercado_pago"}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <Button
              type="submit"
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </Button>
            {status === "success" && (
              <p className="text-center text-sm text-emerald-600">
                Pedido enviado com sucesso.
              </p>
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
