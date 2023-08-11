namespace NodeJS {
    export interface ProcessEnv {
        DB_CONN_STRING: string;
        DB_NAME: string;
        BACKEND_PORT: string;
        SSL_CERT: string;
        SSL_PKEY: string;
        SSL_ENABLED: string;
    }
}
