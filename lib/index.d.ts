import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
interface MikroOrmServiceOptions<T = any> extends Partial<ServiceOptions> {
    Entity: new (...args: any[]) => T;
    orm: MikroORM;
}
export declare class Service<T = any> extends AdapterService {
    protected orm: MikroORM;
    protected Entity: new (...args: any[]) => T;
    protected repository: EntityRepository<T>;
    protected name: string;
    constructor(options: MikroOrmServiceOptions<T>);
    get(id: NullableId, params?: Params): Promise<T>;
    find(params?: Params): Promise<T[]>;
    create(data: Partial<T>, params?: Params): Promise<T>;
    patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T>;
    remove(id: NullableId, params?: Params): Promise<T | {
        success: true;
    }>;
}
export default function <T = any>(options: MikroOrmServiceOptions<T>): Service<T>;
export {};
