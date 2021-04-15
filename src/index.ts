import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NullableId, Params } from '@feathersjs/feathers';
import { EntityRepository, MikroORM, wrap, Utils, FilterQuery } from '@mikro-orm/core';
import { NotFound } from '@feathersjs/errors';

interface MikroOrmServiceOptions<T = any> extends Partial<ServiceOptions> {
  Entity: new (...args: any[]) => T; // constructor for instances of T
  orm: MikroORM;
}

export class Service<T = any> extends AdapterService {
  protected orm: MikroORM;
  protected Entity: new (...args: any[]) => T;
  protected repository: EntityRepository<T>;
  protected name: string;

  constructor (options: MikroOrmServiceOptions<T>) {
    const { orm, Entity } = options;
    super(options);
    this.Entity = Entity;
    this.orm = orm;
    const name = Utils.className(Entity);
    this.repository = this.orm.em.getRepository<T, EntityRepository<T>>(name) as EntityRepository<T>;
    this.name = name;
  }

  async get (id: NullableId, params?: Params): Promise<T> {
    const where = params?.where || params?.query?.where;

    const em = this.orm.em.fork();
    const entity = await em.findOne(this.name, id || where, params?.populate);

    if (!entity) {
      throw new NotFound(`${this.name} not found.`);
    }

    return entity;
  }

  async find (params?: Params): Promise<T[]> {
    if (!params) {
      return this.repository.findAll(params);
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

    // return this.repository.find(where, options);
    const em = this.orm.em.fork();
    return em.find(this.Entity, where, options);
  }

  async create (data: Partial<T>, params?: Params): Promise<T> {
    const entity = new (this.Entity as any)(data);

    // await this.repository.persistAndFlush(entity);
    const em = this.orm.em.fork();
    await em.persistAndFlush(entity);
    return entity;
  }

  async patch (id: NullableId, data: Partial<T>, params?: Params): Promise<T> {
    const where = params?.where || id;
    // const entity = await this.repository.findOne(where);
    const em = this.orm.em.fork();
    const entity = await em.findOne(this.Entity, where);

    if (!entity) {
      throw new NotFound(`cannot patch ${this.name}, entity not found`);
    }

    wrap(entity).assign(data);
    // await this.repository.persistAndFlush(entity);
    // await em.persistAndFlush(entity);
    await em.flush(); // no need to call persist because the entity is already managed by the EM. ref: https://mikro-orm.io/docs/entity-manager/#entity-repositories
    return entity;
  }

  async remove (id: NullableId, params?: Params): Promise<T | { success: true }> {
    const em = this.orm.em.fork();
    if (id) {
      // removing a single entity by id

      let entity: T;
      try {
        // repository methods often complain about argument types being incorrect even when they're not
        // `string` and `number` types _should_ be assignable to `FilterQuery`, but they aren't.
        // comment by package author/maintainer: https://github.com/mikro-orm/mikro-orm/issues/1405#issuecomment-775841265
        // entity = await this.repository.findOneOrFail(id as FilterQuery<T>);
        entity = await em.findOneOrFail(this.Entity, id as FilterQuery<T>);
      } catch (e) {
        throw new NotFound(`${this.name} not found.`);
      }

      // await this.repository.removeAndFlush(entity);
      await em.removeAndFlush(entity);
      return entity;
    } else {
      // removing many entities by a query
      await em.nativeDelete(this.Entity, params?.where);
      await em.flush();
      return { success: true };
    }
  }
}

export default function<T = any> (options: MikroOrmServiceOptions<T>): Service<T> {
  return new Service(options);
}
