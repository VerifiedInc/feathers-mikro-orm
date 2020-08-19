import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { Id, NullableId, Params, Application } from '@feathersjs/feathers';
import { EntityRepository, AnyEntity, Constructor } from 'mikro-orm';
interface MikroOrmServiceOptions<EntityType> extends Partial<ServiceOptions> {
    Entity: Constructor<EntityType>;
    repository: EntityRepository<EntityType>;
    name: string;
}
export declare class MikroOrmService<EntityType extends AnyEntity> extends AdapterService<EntityType> {
    private app;
    private Entity;
    private repository;
    private name;
    constructor(options: MikroOrmServiceOptions<EntityType>);
    setup(app: Application): void;
    _get(id: NullableId, params?: Params): Promise<EntityType>;
    _find(params?: Params): Promise<EntityType[]>;
    _create(data: Partial<EntityType>, params?: Params): Promise<EntityType>;
    _patch(id: NullableId, data: Partial<EntityType>, params?: Params): Promise<EntityType>;
    _remove(id: Id, params?: Params): Promise<EntityType>;
}
export default function createService<EntityType extends AnyEntity>(options: MikroOrmServiceOptions<EntityType>): MikroOrmService<EntityType>;
export {};
