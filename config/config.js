require('dotenv').config();

const config = {
    servers: {
        locale: {
            isProduction: false,
            url: process.env.DEV_BASE_URL
        },
        production: {
            isProduction: true,
            url: process.env.PROD_DB_URL,
        },
        db: {
            url: process.env.DB_BASE_URL
        },
        ftp: {
            url: process.env.FTP_BASE_URL,
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            pwd: process.env.FTP_PWD
        }
    },
    ports: {
        app: process.env.PORT
    },
    tokens: {
        secretKey: process.env.TOKEN_SECRET_KEY
    }
};

module.exports = config;

