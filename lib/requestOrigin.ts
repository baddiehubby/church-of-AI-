// Assumptions: checkout and notice redirects must stay on the machine that posted the form.
// NEXT_PUBLIC_URL is trusted only when it matches this request's host. Empty or foreign hosts
// (a parked production domain while developing on localhost) fall back to the request origin.

export function requestOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function configuredPublicUrl(): string {
  return (process.env.NEXT_PUBLIC_URL ?? "").trim().replace(/\/+$/, "");
}

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export function hostsMatch(left: string, right: string): boolean {
  const a = hostnameOf(left);
  const b = hostnameOf(right);
  return Boolean(a && b && a === b);
}

export function safeRedirectOrigin(request: Request): string {
  const origin = requestOrigin(request);
  const configured = configuredPublicUrl();
  if (!configured) return origin;
  return hostsMatch(configured, origin) ? configured : origin;
}

export function checkoutReturnUrl(request: Request, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${safeRedirectOrigin(request)}${normalized}`;
}

export function localRedirect(request: Request, path: string, status = 303): Response {
  return Response.redirect(checkoutReturnUrl(request, path), status);
}
