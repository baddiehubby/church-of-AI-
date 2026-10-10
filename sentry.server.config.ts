// Assumptions: loaded from instrumentation.ts in the nodejs runtime. No-op when SENTRY_DSN is unset.

import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentryOptions";

Sentry.init(sentryOptions(process.env.SENTRY_DSN));
