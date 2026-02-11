"use client";

import Button from "@/shared/components/Button";

export default function HomeLoginPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Acesse o painel admin</h1>
            <p className="mt-2 text-sm text-slate-500">
              Seja bem vindo! Por favor para entrar informe o email e senha.
            </p>
          </div>

          <div className="">
            <form className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Remember for 30 days
                </label>
                <a
                  href="#"
                  className="font-medium text-violet-600 hover:text-violet-700 underline underline-offset-2"
                >
                  Forgot password
                </a>
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href="#"
              className="font-medium text-violet-600 hover:text-violet-700 underline underline-offset-2"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
