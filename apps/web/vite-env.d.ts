/// <reference types="vite/client" />
interface ViteEnv {
  readonly VITE_API_URL: string;
}
interface ImportMetaEnv {
  readonly env: ViteEnv;
}
