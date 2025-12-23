import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Direcciones de ordenamiento permitidas.
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Resultado de parseo de parámetros de ordenamiento.
 */
export interface SortParams {
  readonly field: string;
  readonly direction: SortDirection;
}

/**
 * DTO mejorado de paginación con características adicionales:
 * - Ordenamiento (sort)
 * - Búsqueda (search)
 * - Selección de campos (fields)
 *
 * @example
 * // Query: ?page=2&limit=10&sort=createdAt:desc&search=tesla&fields=id,name,plate
 * {
 *   page: 2,
 *   limit: 10,
 *   sort: "createdAt:desc",
 *   search: "tesla",
 *   fields: "id,name,plate"
 * }
 */
export class EnhancedPaginationQueryDto extends PaginationQueryDto {
  /**
   * Parámetro de ordenamiento.
   * Formato: "campo:dirección" (ej: "createdAt:desc", "name:asc")
   */
  @IsOptional()
  @IsString({ message: 'El parámetro sort debe ser un string' })
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$/i, {
    message: 'Formato sort inválido. Use: campo:asc o campo:desc',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    // Si no es string, devolvemos undefined o el valor original
    // dependiendo de lo que necesites
    return value;
  })
  public sort?: string;

  /**
   * Término de búsqueda.
   */
  @IsOptional()
  @IsString({ message: 'El parámetro search debe ser un string' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  public search?: string;

  /**
   * Campos a seleccionar (separados por coma).
   * Ej: "id,name,plate"
   */
  @IsOptional()
  @IsString({ message: 'El parámetro fields debe ser un string' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  public fields?: string;

  /**
   * Parsea el parámetro sort en campo y dirección.
   *
   * @returns Objeto con field y direction, o undefined si no hay sort o es inválido
   *
   * @example
   * dto.sort = "createdAt:desc";
   * dto.getSortParams(); // { field: "createdAt", direction: SortDirection.DESC }
   *
   * dto.sort = undefined;
   * dto.getSortParams(); // undefined
   */
  public getSortParams(): SortParams | undefined {
    if (!this.sort) {
      return undefined;
    }

    try {
      const [fieldRaw, directionRaw] = this.sort.split(':');

      if (!fieldRaw || !directionRaw) {
        return undefined;
      }

      const field = fieldRaw.trim();
      const direction = directionRaw.trim().toLowerCase();

      if (!field || !direction) {
        return undefined;
      }

      // Validación tipo-safe con switch
      switch (direction) {
        case 'asc':
          return {
            field,
            direction: SortDirection.ASC,
          };
        case 'desc':
          return {
            field,
            direction: SortDirection.DESC,
          };
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }

  /**
   * Obtiene el array de campos seleccionados.
   *
   * @returns Array de nombres de campos, o undefined si no hay fields
   *
   * @example
   * dto.fields = "id,name,plate";
   * dto.getSelectedFields(); // ["id", "name", "plate"]
   *
   * dto.fields = undefined;
   * dto.getSelectedFields(); // undefined
   */
  public getSelectedFields(): readonly string[] | undefined {
    if (!this.fields) {
      return undefined;
    }

    try {
      const fields = this.fields
        .split(',')
        .map((field) => field.trim())
        .filter((field) => field.length > 0);

      return fields.length > 0 ? fields : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Obtiene el término de búsqueda normalizado.
   *
   * @returns String de búsqueda trimmed, o undefined si está vacío
   *
   * @example
   * dto.search = "  tesla  ";
   * dto.getNormalizedSearch(); // "tesla"
   *
   * dto.search = "   ";
   * dto.getNormalizedSearch(); // undefined
   */
  public getNormalizedSearch(): string | undefined {
    if (!this.search) {
      return undefined;
    }

    const trimmed = this.search.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Valida si hay parámetros de filtrado activos.
   * Útil para logging o optimizaciones.
   */
  public hasFilters(): boolean {
    return Boolean(this.sort || this.search || this.fields);
  }

  /**
   * Serializa los parámetros activos a objeto.
   * Útil para logging o debugging.
   */
  public toFilterObject(): {
    readonly page: number;
    readonly limit: number;
    readonly sort?: SortParams;
    readonly search?: string;
    readonly fields?: readonly string[];
  } {
    const sortParams = this.getSortParams();
    const normalizedSearch = this.getNormalizedSearch();
    const selectedFields = this.getSelectedFields();

    return {
      page: this.page,
      limit: this.limit,
      sort: sortParams,
      search: normalizedSearch,
      fields: selectedFields,
    };
  }
}
