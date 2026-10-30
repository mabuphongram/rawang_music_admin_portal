/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL, including its /api path. */
  readonly APP_URL?: string;
  /** Public MinIO bucket URL used to resolve object keys such as singer/foo.jpg. */
  readonly MINIO_PREFIX_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_MINIO_PREFIX?: string;
  /** Optional shared key required by a protected presence endpoint. */
  readonly PRESENCE_ADMIN_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
