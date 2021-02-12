import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { AnyEntity, EntityRepository, MikroORM, wrap } from '@mikro-orm/core';
import { NotFound } from '@feathersjs/errors';

interface MikroOrmServiceOptions extends Partial<ServiceOptions> {
  Entity: AnyEntity;
  orm: MikroORM;
  name: string;
}

export class Service extends AdapterService {
  protected orm: MikroORM;
  protected Entity: any;
  protected repository: EntityRepository<any>;
  protected name: string;

  constructor (options: MikroOrmServiceOptions) {
    super(options);
    this.Entity = options.Entity;
    this.orm = options.orm;
    this.repository = this.orm.em.getRepository(options.name);
    this.name = options.name;
  }

  async get (id: NullableId, params?: Params): Promise<any> {
    const where = params?.where || params?.query?.where;

    const entity = await this.orm.em.findOne(this.name, id || where);

    if (!entity) {
      throw new NotFound(`${this.name} not found.`);
    }

    return entity;
  }

  async find (params?: Params): Promise<any[]> {
    if (!params) {
      return this.repository.findAll();
    }

    const where = params.where
      ? { ...params.where }
      : params.query
        ? { ...params.query }
        : {};

    const options = params.options ? { ...params.options } : {};

    if (where.$limit) {
      options.limit = where.$limit;
      delete where.$limit;
    }

    return this.repository.find(where, options);
  }

  async create (data: Partial<AnyEntity>, params?: Params): Promise<any> {
    const entity = new this.Entity(data);

    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async patch (id: NullableId, data: Partial<AnyEntity>, params?: Params): Promise<any> {
    const where = params?.where || id;
    const entity = await this.repository.findOne(where);

    if (!entity) {
      throw new NotFound(`cannot patch ${this.name}, entity not found`);
    }

    wrap(entity).assign(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async remove (id: NullableId, params?: Params): Promise<any> {
    const where = params?.where || id;
    const entity = await this.get(where);
    // await this.orm.em.nativeDelete(this.Entity, where);
    // await this.orm.em.flush();
    await this.repository.removeAndFlush(entity);
    return entity;
  }
}

export default function (options: MikroOrmServiceOptions): Service {
  return new Service(options);
}
