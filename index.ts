import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
import { NotFound } from '@feathersjs/errors';
import { Id, Params } from '@feathersjs/feathers';

import { EntityRepository, AnyEntity } from 'mikro-orm';

interface MikroOrmServiceOptions extends Partial<ServiceOptions> {
  Entity: any;
  repository: EntityRepository<any>;
  name: string;
}

export class MikroOrmService extends AdapterService<any> {
  private app!: any;

  private Entity: any;

  private repository: EntityRepository<any>;

  private name: string;

  constructor(options: MikroOrmServiceOptions) {
    super(options);
    this.Entity = options.Entity;
    this.repository = options.repository;
    this.name = options.name;
  }

  setup(app: any): void {
    this.app = app;
  }

  async get(id: Id): Promise<AnyEntity<any>> {
    const entity = await this.repository.findOne(id);

    if (!entity) {
      throw new NotFound(`${this.name} not found`);
    }

    return entity;
  }

  async find(params?: Params): Promise<AnyEntity<any>[]> {
    if (!params) {
      return this.repository.findAll();
    }
    const entities = await this.repository.find(params.where, params.options);
    return entities;
  }

  async create(data: Partial<AnyEntity<any>>): Promise<AnyEntity<any>> {
    const entity = new this.Entity(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async patch(id: Id, data: Partial<AnyEntity<any>>): Promise<AnyEntity<any>> {
    const entity = await this.repository.findOne(id);

    if (!entity) {
      throw new NotFound(`cannot patch ${this.name}, entity not found`);
    }

    entity.assign(data);
    await this.repository.persistAndFlush(entity);
    return entity;
  }

  async remove(id: Id): Promise<AnyEntity<any>> {
    const entity = await this.repository.findOne(id);

    if (!entity) {
      throw new NotFound(`cannot remove ${this.name}, entity not found`);
    }

    await this.repository.removeAndFlush(entity);
    return entity;
  }
}

export default function (options: MikroOrmServiceOptions): MikroOrmService {
  return new MikroOrmService(options);
}
