/**
 * 伺服器配置
 */

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const SOCKET_CONFIG = {
  PING_INTERVAL: 25000,
  PING_TIMEOUT: 20000,
};
