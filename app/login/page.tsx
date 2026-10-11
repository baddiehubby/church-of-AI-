"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { premium } from "@/content/premium";
import { isRecord } from "@/lib/guards";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setDevLink(null);
    try {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const payload: unknown = await response.json();
      const record = isRecord(payload) ? payload : {};
      if (!response.ok) {
        setMessage(typeof record.error === "string" ? record.error : premium.errors.nap);
        return;
      }
      setMessage("If that address can be filed, a sign-in link is on its way. Check your email.");
      if (typeof record.devLink === "string") setDevLink(record.devLink);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-mono text-sm tracking-[0.2em] text-brass-light">{premium.loginCta}</h1>
      <p className="serif-warm mt-4 text-2xl text-bone">acha, leave your email. we will send a link, not a password.</p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-ring min-h-12 border border-brass/70 bg-night px-3 text-bone"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-brass press w-full sm:w-auto">
          {pending ? "SENDING" : "SEND SIGN-IN LINK"}
        </button>
      </form>
      {message ? (
        <p className="mt-4 text-sm text-bone/90" role="status">
          {message}
        </p>
      ) : null}
      {devLink ? (
        <p className="mt-3 text-sm">
          <a className="text-brass-light underline" href={devLink}>
            Local sign-in link
          </a>
        </p>
      ) : null}
      <div className="mt-10">
        <Disclaimer surface="void" />
      </div>
    </article>
  );
}
