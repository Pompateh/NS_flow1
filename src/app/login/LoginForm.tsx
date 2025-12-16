"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="w-full max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await signIn("credentials", {
            username,
            password,
            redirect: true,
            callbackUrl: "/dashboard",
          });

          if (res?.error) setMessage("Invalid username or password.");
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="newstalgia39"
          className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {message ? (
        <p className="text-sm text-zinc-600" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
