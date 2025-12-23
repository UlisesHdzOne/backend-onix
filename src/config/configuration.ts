import { registerAs } from '@nestjs/config';
import * as joi from 'joi';

export const validationSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().port().default(3000),
  DATABASE_URL: joi
    .string()
    .uri({ scheme: ['postgresql'] })
    .required()
    .description('URL completa de conexión a PostgreSQL'),
  CORS_ORIGIN: joi
    .string()
    .default('http://localhost:5173')
    .description('Origen permitido para CORS'),
});

export default registerAs('app', () => {
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    database: {
      url: process.env.DATABASE_URL,
    },
    cors: {
      origin: corsOrigin.includes(',')
        ? corsOrigin.split(',').map((url) => url.trim())
        : corsOrigin,
    },
  };
});
