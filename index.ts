import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NotFound } from '@feathersjs/errors';
import { Id, NullableId, Params, Application } from '@feathersjs/feathers';
import { EntityRepository, AnyEntity, Constructor } from 'mikro-orm';

interface MikroOrmServiceOptions<EntityType> extends Partial<ServiceOptions> {
  Entity: Constructor<EntityType>;
  repository: EntityRepository<EntityType>;
  name: string;
}

export class MikroOrmService<EntityType extends AnyEntity> extends AdapterService<EntityType> {
  private app!: Application;

  private Entity: Constructor<EntityType>;

  private repository: EntityRepository<EntityType>;

  private name: string;

  constructor (options: MikroOrmServiceOptions<EntityType>) {
    super(options);
    this.Entity = options.Entity;
    this.repository = options.repository;
    this.name = options.name;
  }

  setup (app: Application): void {
    this.app = app;
  }

  async _get (id: NullableId, params?: Params): Promise<EntityType> {
    const where = params && (params.where || (params.query && params.query.where));
    const entity = await this.repository.findOne(id || where);

    if (!entity) {
      throw new NotFound(`${this.name} not found`);
    }

    return entity;
  }

  async _find (params?: Params): Promise<EntityType[]> {
    if (!params) {
      return this.repository.findAll();
    }
    const entities = await this.repository.find(params.where, params.options);
    return entities;
  }

  async _create (data: Partial<EntityType>, params?: Params): Promise<EntityType> {
    const entity = new this.Entity(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async _patch (id: NullableId, data: Partial<EntityType>, params?: Params): Promise<EntityType> {
    const where = params?.where || id;
    const entity = await this.repository.findOne(where);

    if (!entity) {
      throw new NotFound(`cannot patch ${this.name}, entity not found`);
    }

    entity.assign(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async _remove (id: Id, params?: Params): Promise<EntityType> {
    const where = params?.where || id;
    const entity = await this.repository.findOne(where);

    if (!entity) {
      throw new NotFound(`cannot remove ${this.name}, entity not found`);
    }

    await this.repository.removeAndFlush(entity);
    return entity;
  }
}

export default function createService<EntityType extends AnyEntity> (options: MikroOrmServiceOptions<EntityType>): MikroOrmService<EntityType> {
  return new MikroOrmService<EntityType>(options);
}
