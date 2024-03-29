import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Paginated, PaginationOptions, Params } from '@feathersjs/feathers';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
interface MikroOrmServiceOptions<T = any> extends Partial<ServiceOptions> {
    Entity: new (...args: any[]) => T;
    orm: MikroORM;
}
export declare class Service<T = any> extends AdapterService {
    protected orm: MikroORM;
    protected Entity: new (...args: any[]) => T;
    protected name: string;
    protected paginationOptions?: Partial<PaginationOptions>;
    constructor(options: MikroOrmServiceOptions<T>);
    get(id: NullableId, params?: Params): Promise<T>;
    find(params?: Params): Promise<T[] | Paginated<T>>;
    create(data: Partial<T>, params?: Params): Promise<T>;
    patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T | T[]>;
    remove(id: NullableId, params?: Params): Promise<T | {
        success: boolean;
    }>;
    /**
     * Helper to got the EntityRepository with fresh request context via Entity Manager forking
     * ref: https://mikro-orm.io/docs/identity-map/#forking-entity-manager, https://mikro-orm.io/docs/identity-map/
     * @returns
     */
    protected _getEntityRepository(): EntityRepository<T>;
    /**
   * helper to get a total count of entities matching a query
   * @param query the query to match by
   * @param skip the $skip value from query params. kind of nonsensical and will not be used in the actual query, but is required in the return type. default 0.
   * @returns Promise<Paginated<never>> a feathers Paginated object with the total count
   */
    private _findCount;
    /**
     * helper to get paginated results matching a query
     * @param query the filter query to match by
     * @param options find options
     * @returns Promise<Paginated<T>> a feathers Paginated object with the query results
     */
    private _findPaginated;
    /**
     * helper to translate feathers query syntax to mikro-orm options syntax
     * @param query feathers query
     * @returns FindOptions mikro-orm FindOptions
     */
    private _translateFeathersQueryToFindOptions;
}
export default function <T = any>(options: MikroOrmServiceOptions<T>): Service<T>;
export {};
