"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, type LoginState } from "@/app/auth/actions";

const initialState: LoginState = { error: null };

export default function AuthPage() {
  return <AuthForm />;
}

function AuthForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const currentState = state ?? initialState;

  useEffect(() => {
    if (currentState.redirectTo) {
      router.replace(currentState.redirectTo);
    }
  }, [currentState.redirectTo, router]);

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[#f5f5f5] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Connexion</h1>
          <p className="mt-2 text-sm text-gray-600">
            Accédez à votre espace.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#f28c28] focus:ring-2 focus:ring-[#f28c28]/20"
            />
          </div>

          {currentState.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {currentState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#f28c28] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#e07b12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
