// Assumptions: loaded from instrumentation.ts in the edge runtime (middleware, if ever added). No-op without a DSN.

import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentryOptions";

Sentry.init(sentryOptions(process.env.SENTRY_DSN));
