import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DatabaseError,
  NotFoundError,
  ConflictError,
  AppError,
} from '../../core/errors/custom.errors';

/**
 * Metadata de errores de Prisma (type-safe).
 */
interface PrismaErrorMeta {
  readonly target?: readonly string[];
  readonly field_name?: string;
  readonly modelName?: string;
  readonly [key: string]: unknown;
}

/**
 * Type guard para verificar si un objeto tiene la estructura de meta de Prisma.
 */
function hasPrismaMeta(obj: unknown): obj is { meta?: PrismaErrorMeta } {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objWithMeta = obj as { meta?: unknown };

  return (
    'meta' in objWithMeta &&
    (objWithMeta.meta === undefined ||
      objWithMeta.meta === null ||
      typeof objWithMeta.meta === 'object')
  );
}

/**
 * Type guard mejorado para PrismaClientKnownRequestError.
 * Verifica la estructura exacta del error sin usar 'as any'.
 *
 * @param error - Error desconocido a verificar
 * @returns true si es un error conocido de Prisma
 */
export function isPrismaKnownRequestError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.constructor.name !== 'PrismaClientKnownRequestError') {
    return false;
  }

  // Type-safe check for code property
  const errorRecord = error as unknown as Record<string, unknown>;
  const code = errorRecord.code;

  if (typeof code !== 'string' || !/^P\d{4}$/.test(code)) {
    return false;
  }

  // Use a generic record to safely use the 'in' operator
  const errorRecordForMeta = error as unknown as Record<string, unknown>;
  return !('meta' in errorRecordForMeta) || hasPrismaMeta(error);
}

/**
 * Type guard para cualquier error de Prisma (genérico).
 */
export function isPrismaClientError(error: unknown): error is Error & { code?: string } {
  if (!(error instanceof Error)) {
    return false;
  }

  const constructorName = error.constructor.name;
  const errorRecord = error as unknown as Record<string, unknown>;
  const code = errorRecord.code;

  const hasValidCode = typeof code === 'string' && code.startsWith('P');

  return (
    constructorName.startsWith('PrismaClient') || constructorName.includes('Prisma') || hasValidCode
  );
}

/**
 * Servicio utilitario para manejo de errores de base de datos.
 * Centraliza la transformación de errores de Prisma a errores de aplicación.
 */
@Injectable()
export class ErrorUtilsService {
  /**
   * Ejecuta una operación de BD con manejo automático de errores.
   *
   * @example
   * await errorUtils.withDatabaseErrorHandling('findCar', async () => {
   *   return await prisma.car.findUnique({ where: { id } });
   * });
   *
   * @param operation - Nombre de la operación (para logging)
   * @param callback - Función async a ejecutar
   * @returns Resultado de la operación
   * @throws AppError si ocurre un error
   */
  async withDatabaseErrorHandling<T>(operation: string, callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error: unknown) {
      throw this.transformError(error, operation);
    }
  }

  /**
   * Transforma errores desconocidos en AppErrors tipados.
   */
  private transformError(error: unknown, operation: string): AppError | Error {
    if (error instanceof AppError) {
      return error;
    }

    if (isPrismaKnownRequestError(error)) {
      return this.handlePrismaKnownRequestError(error, operation);
    }

    if (isPrismaClientError(error)) {
      return new DatabaseError(
        operation,
        error,
        'code' in error && typeof error.code === 'string' ? error.code : undefined,
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Error desconocido: ${String(error)}`);
  }

  /**
   * Maneja errores conocidos de Prisma con códigos específicos.
   * Usa exhaustive checking para cubrir todos los casos.
   */
  private handlePrismaKnownRequestError(
    error: Prisma.PrismaClientKnownRequestError,
    operation: string,
  ): AppError {
    const { code, meta } = error;

    switch (code) {
      case 'P2002': {
        const field = this.extractFieldFromMeta(meta);
        return new ConflictError('Recurso', field);
      }

      case 'P2025': {
        return new NotFoundError('Recurso');
      }

      case 'P2003': {
        const field = this.extractFieldFromMeta(meta);
        return new DatabaseError(
          operation,
          new Error(`Violación de restricción de clave foránea en: ${field}`),
          code,
        );
      }

      case 'P2014': {
        const field = this.extractFieldFromMeta(meta);
        return new DatabaseError(
          operation,
          new Error(`Relación requerida faltante: ${field}`),
          code,
        );
      }

      case 'P2015': {
        return new NotFoundError('Registro relacionado');
      }

      default: {
        return new DatabaseError(operation, error, code);
      }
    }
  }

  /**
   * Valida que una entidad existe, lanza NotFoundError si es null.
   *
   * @example
   * const car = errorUtils.validateEntityExists(
   *   await prisma.car.findUnique({ where: { id } }),
   *   'Car',
   *   id
   * );
   */
  validateEntityExists<T>(
    entity: T | null | undefined,
    entityName: string,
    id?: string | number,
  ): T {
    if (entity === null || entity === undefined) {
      throw new NotFoundError(entityName, id);
    }
    return entity;
  }

  /**
   * Verifica que una entidad NO existe, lanza ConflictError si existe.
   * Útil para validaciones de unicidad.
   */
  checkConflict<T>(entity: T | null | undefined, entityName: string, fieldName: string): void {
    if (entity !== null && entity !== undefined) {
      throw new ConflictError(entityName, fieldName);
    }
  }

  /**
   * Versión async de validateEntityExists.
   */
  async validateEntityExistsAsync<T>(
    entityPromise: Promise<T | null | undefined>,
    entityName: string,
    id?: string | number,
  ): Promise<T> {
    const entity = await entityPromise;
    return this.validateEntityExists(entity, entityName, id);
  }

  /**
   * Valida múltiples entidades en batch.
   */
  validateEntitiesExist<T>(
    entities: Array<T | null | undefined>,
    entityName: string,
    ids?: Array<string | number>,
  ): T[] {
    return entities.map((entity, index) => {
      const id = ids?.[index];
      return this.validateEntityExists(entity, entityName, id);
    });
  }

  /**
   * Extrae el nombre del campo desde meta de Prisma.
   * Soporta múltiples formatos de metadata.
   */
  private extractFieldFromMeta(meta?: unknown): string {
    if (!meta || typeof meta !== 'object' || meta === null) {
      return 'campo';
    }

    const metaObj = meta as Record<string, unknown>;

    // Check target array
    const targetValue = metaObj['target'];
    if (Array.isArray(targetValue)) {
      const targetArray = targetValue as unknown[];
      if (targetArray.length > 0) {
        const firstTarget = targetArray[0];
        if (typeof firstTarget === 'string') {
          return this.cleanFieldName(firstTarget);
        }
      }
    }

    // Check field_name
    const fieldNameValue = metaObj['field_name'];
    if (typeof fieldNameValue === 'string') {
      return this.cleanFieldName(fieldNameValue);
    }

    return 'campo';
  }

  /**
   * Limpia el nombre del campo removiendo prefijos/sufijos técnicos.
   */
  private cleanFieldName(field: string): string {
    return field.replace(/^.*_/, '').replace(/_key$/, '').replace(/[`"]/g, '').trim();
  }

  /**
   * Obtiene información detallada de un error (para debugging).
   */
  getErrorInfo(error: unknown): {
    readonly type: string;
    readonly message: string;
    readonly code?: string;
    readonly isPrisma: boolean;
    readonly isOperational: boolean;
  } {
    if (error instanceof AppError) {
      return {
        type: error.constructor.name,
        message: error.message,
        code: error.code,
        isPrisma: false,
        isOperational: error.isOperational,
      };
    }

    if (isPrismaKnownRequestError(error)) {
      return {
        type: 'PrismaClientKnownRequestError',
        message: error.message,
        code: error.code,
        isPrisma: true,
        isOperational: false,
      };
    }

    if (isPrismaClientError(error)) {
      const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
      return {
        type: 'PrismaClientError',
        message: error.message,
        code,
        isPrisma: true,
        isOperational: false,
      };
    }

    if (error instanceof Error) {
      return {
        type: error.constructor.name,
        message: error.message,
        isPrisma: false,
        isOperational: false,
      };
    }

    return {
      type: 'Unknown',
      message: String(error),
      isPrisma: false,
      isOperational: false,
    };
  }
}
