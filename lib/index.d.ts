import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { AnyEntity, EntityRepository, MikroORM } from '@mikro-orm/core';
interface MikroOrmServiceOptions extends Partial<ServiceOptions> {
    Entity: AnyEntity;
    orm: MikroORM;
    name: string;
}
export declare class Service extends AdapterService {
    protected orm: MikroORM;
    protected Entity: any;
    protected repository: EntityRepository<any>;
    protected name: string;
    constructor(options: MikroOrmServiceOptions);
    get(id: NullableId, params?: Params): Promise<any>;
    find(params?: Params): Promise<any[]>;
    create(data: Partial<AnyEntity>, params?: Params): Promise<any>;
    patch(id: NullableId, data: Partial<AnyEntity>, params?: Params): Promise<any>;
    remove(id: NullableId, params?: Params): Promise<{
        success: boolean;
    }>;
}
export default function (options: MikroOrmServiceOptions): Service;
export {};
