/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_AI_GATEWAY_URL: string;
  readonly VITE_AI_GATEWAY_KEY: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
