import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { EntityRepository, MikroORM } from '@mikro-orm/core';
interface MikroOrmServiceOptions<T> extends Partial<ServiceOptions> {
    Entity: T;
    orm: MikroORM;
}
export declare class Service<T> extends AdapterService {
    protected orm: MikroORM;
    protected Entity: T;
    protected repository: EntityRepository<T>;
    protected name: string;
    constructor(options: MikroOrmServiceOptions<T>);
    get(id: NullableId, params?: Params): Promise<T>;
    find(params?: Params): Promise<T[]>;
    create(data: Partial<T>, params?: Params): Promise<T>;
    patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T>;
    remove(id: NullableId, params?: Params): Promise<T>;
}
export default function <T>(options: MikroOrmServiceOptions<T>): Service<T>;
export {};
