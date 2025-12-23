import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isDev = process.env.NODE_ENV === 'development';
    super({
      log: [
        ...(isDev ? [{ emit: 'stdout', level: 'query' }] : []),
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ] as Prisma.LogDefinition[],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Conectado a la base de datos exitosamente');
    } catch (error) {
      this.logger.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('🔌 Desconectado de la base de datos');
    } catch (error) {
      this.logger.error('❌ Error desconectando de la base de datos:', error);
    }
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('🚫 No se permite limpiar DB en producción');
      return;
    }

    this.logger.log('🧹 Limpiando base de datos...');
    try {
      await this.$executeRawUnsafe(`
        DO $$ 
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
        END $$;
      `);
      this.logger.log('✅ Base de datos limpiada exitosamente');
    } catch (error) {
      this.logger.error('❌ Error limpiando base de datos:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<{
    status: string;
    timestamp: Date;
    database: string;
  }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date(),
        database: 'connected',
      };
    } catch (error) {
      this.logger.error('❌ Health check falló:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        database: 'disconnected',
      };
    }
  }
}
