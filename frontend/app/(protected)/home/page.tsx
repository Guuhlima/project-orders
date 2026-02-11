"use client";

import Button from "@/shared/components/Button";
import { useState } from "react";

export default function HomeOrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const urlWebhook = process.env.NEXT_PUBLIC_URL_WEBHOOK_N8N;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        urlWebhook!,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
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
                    defaultChecked
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
                Erro ao enviar. Tente novamente.
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
