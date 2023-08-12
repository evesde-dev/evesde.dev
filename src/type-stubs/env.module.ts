namespace NodeJS {
    export interface ProcessEnv {
        DB_CONN_STRING: string;
        DB_NAME: string;
        BACKEND_PORT: string;
        SSL_CERT: string;
        SSL_PKEY: string;
        SSL_ENABLED: string;
        SWAG_PAGE_TITLE: string;
        SWAG_PAGE_DESC: string;
        SWAG_VERSION: string;
        SWAG_BASE_PATH: string;
        SWAG_HOST: string;
        DEFAULT_LIMIT: string;
    }
}
