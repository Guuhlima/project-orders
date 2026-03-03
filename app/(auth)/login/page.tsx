"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import api, { AUTH_TOKEN_KEY } from "@/lib/api";
import Button from "@/shared/components/Button";

function extractAccessToken(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== "object") return null;

  const source = responseData as Record<string, unknown>;
  const nested =
    source.data && typeof source.data === "object"
      ? (source.data as Record<string, unknown>)
      : null;

  const candidate =
    source.accessToken ??
    source.access_token ??
    source.token ??
    source.jwt ??
    nested?.accessToken ??
    nested?.access_token ??
    nested?.token ??
    nested?.jwt;

  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : null;
}

export default function HomeLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;

    if (token) {
      router.replace("/config");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !password) {
      setErrorMessage("Informe nome e senha para entrar.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/login", { name, password });
      const token = extractAccessToken(data);

      if (!token) {
        setErrorMessage("Login realizado, mas a API nao retornou token.");
        return;
      }

      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      router.replace("/config");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        axiosError.response?.data?.message ?? "Nao foi possivel fazer login."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Acesse o painel admin</h1>
            <p className="mt-2 text-sm text-slate-500">
              Seja bem vindo! Para entrar, informe nome e senha.
            </p>
          </div>

          <div className="">
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Nome
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Senha
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  autoComplete="current-password"
                  required
                />
              </label>

              <Button
                type="submit"
                className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
              {errorMessage && (
                <p className="text-center text-sm text-red-600">{errorMessage}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
