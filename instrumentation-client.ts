// Assumptions: browser Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined at build from SENTRY_DSN by next.config.ts
// (a DSN is not a secret). Empty DSN = disabled no-op.

import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentryOptions";

Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));
