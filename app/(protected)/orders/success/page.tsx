"use client";

import Link from "next/link";

export default function Page() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-100 px-4 py-10 text-slate-900">
            <div className="mx-auto flex w-full max-w-xl items-center justify-center">
                <section className="w-full rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                        <span aria-hidden>✓</span>
                    </div>

                    <h1 className="mt-5 text-center text-2xl font-semibold">
                        Pedido confirmado
                    </h1>

                    <p className="mt-2 text-center text-sm text-slate-600 sm:text-base">
                        Seu pedido foi recebido com sucesso. Em breve ele estará pronto.
                    </p>

                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-700">
                            Você pode acompanhar o status na tela de pedidos.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/orders"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                            Ver pedidos
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
