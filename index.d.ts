import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params, Application, Paginated } from '@feathersjs/feathers';
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
    _find(params?: Params): Promise<EntityType[] | Paginated<EntityType>>;
    _create(data: Partial<EntityType>, params?: Params): Promise<EntityType>;
    _patch(id: NullableId, data: Partial<EntityType>, params?: Params): Promise<EntityType | EntityType[]>;
    _remove(id: NullableId, params?: Params): Promise<EntityType | EntityType[]>;
    get(id: NullableId, params?: Params): Promise<EntityType>;
    find(params?: Params): Promise<EntityType[] | Paginated<EntityType>>;
    create(data: Partial<EntityType>, params?: Params): Promise<EntityType>;
    patch(id: NullableId, data: Partial<EntityType>, params?: Params): Promise<EntityType | EntityType[]>;
    remove(id: NullableId, params?: Params): Promise<EntityType | EntityType[]>;
}
export default function createService<EntityType extends AnyEntity>(options: MikroOrmServiceOptions<EntityType>): MikroOrmService<EntityType>;
export {};
