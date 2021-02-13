import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { EntityRepository, MikroORM, wrap, Utils } from '@mikro-orm/core';
import { NotFound } from '@feathersjs/errors';

interface MikroOrmServiceOptions<T = any> extends Partial<ServiceOptions> {
  Entity: T;
  orm: MikroORM;
}

export class Service<T = any> extends AdapterService {
  protected orm: MikroORM;
  protected Entity: T;
  protected repository: EntityRepository<T>;
  protected name: string;

  constructor (options: MikroOrmServiceOptions<T>) {
    const { orm, Entity } = options;
    super(options);
    this.Entity = Entity;
    this.orm = orm;
    const name = Utils.className(Entity as any);
    this.repository = this.orm.em.getRepository<T, EntityRepository<T>>(name) as EntityRepository<T>;
    this.name = name;
  }

  async get (id: NullableId, params?: Params): Promise<T> {
    const where = params?.where || params?.query?.where;

    const entity = await this.orm.em.findOne(this.name, id || where);

    if (!entity) {
      throw new NotFound(`${this.name} not found.`);
    }

    return entity;
  }

  async find (params?: Params): Promise<T[]> {
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

  async create (data: Partial<T>, params?: Params): Promise<T> {
    const entity = new (this.Entity as any)(data);

    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async patch (id: NullableId, data: Partial<T>, params?: Params): Promise<T> {
    const where = params?.where || id;
    const entity = await this.repository.findOne(where);

    if (!entity) {
      throw new NotFound(`cannot patch ${this.name}, entity not found`);
    }

    wrap(entity).assign(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async remove (id: NullableId, params?: Params): Promise<T> {
    const where = params?.where || id;
    const entity = await this.get(where);
    // await this.orm.em.nativeDelete(this.Entity, where);
    // await this.orm.em.flush();
    await this.repository.removeAndFlush(entity);
    return entity;
  }
}

export default function<T = any> (options: MikroOrmServiceOptions<T>): Service<T> {
  return new Service(options);
}
