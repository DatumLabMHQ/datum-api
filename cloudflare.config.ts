import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "c9bf3d8e875ffe933a9bf895695e0fd1", // Datum Labs
  worker: defineWorker({
    name: "datum-api",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-05",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Worker secrets, read via process.env: DATABASE_URL (Neon, datum_reader role) and
      // DATUM_API_KEYS (comma-separated; unset = open API). Set them with
      // `npx cf workers secrets update <NAME> --worker datum-api`. They are not declared with
      // bindings.secret() because cf deploy then refuses to deploy while they are unset; once both
      // are set, declaring them is safe (and needed for `npm run dev` to load them from .dev.vars).
    },
  }),
});
