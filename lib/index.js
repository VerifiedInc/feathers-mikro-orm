"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createService = exports.MikroORMService = exports.MikroORMAdapter = void 0;
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const lib_1 = require("@feathersjs/errors/lib");
const lodash_1 = require("lodash");
class MikroORMAdapter extends adapter_commons_1.AdapterBase {
    constructor(options) {
        super(options);
        this.em = options.em;
        this.Entity = options.Entity;
        this.paginate = options.paginate;
    }
    async $find(_params = {}) {
        throw new lib_1.NotImplemented();
    }
    async _find(_params = {}) {
        if (!_params) {
            return await this._findAll();
        }
        if (_params.paginate) {
            return await this._findPaginated(_params);
        }
        else {
            return await this._findUnpaginated(_params);
        }
    }
    // get
    async $get(_id, _params) {
        throw new lib_1.NotImplemented();
    }
    async _get(id, params = {}) {
        return id == null
            ? await this._getByParams(params)
            : await this._getById(id);
    }
    async $create(data, _params = {}) {
        throw new lib_1.NotImplemented();
    }
    async _create(data, _params = {}) {
        return Array.isArray(data)
            ? this._createMany(data, _params)
            : this._createOne(data, _params);
    }
    // update
    async $update(_id, _data, _params) {
        throw new lib_1.NotImplemented();
    }
    async _update(id, data, _params = {}) {
        throw new lib_1.NotImplemented();
    }
    async $patch(id, data, _params = {}) {
        throw new lib_1.NotImplemented();
    }
    async _patch(id, data, _params = {}) {
        return id
            ? this._patchById(id, data, _params)
            : this._patchByParams(data, _params);
    }
    async $remove(id, _params = {}) {
        throw new lib_1.NotImplemented();
    }
    async _remove(id, params = {}) {
        return id
            ? this._removeById(id, params)
            : this._removeByParams(params);
    }
    // find helpers
    async _findPaginated(params) {
        const { paginate = {}, query } = params;
        // pagination options from params override the default ones from the service
        const paginationOptions = this.paginate
            ? {
                ...this.paginate,
                ...paginate
            }
            : paginate;
        /**
         * limit is
         * - the lower value of params.query.$limit and paginationOptions.max, if both are present
         * - params.query.$limit, if paginationOptions.max is not present
         * - paginationOptions.default (may be undefined), if params.query.$limit is not present
         */
        const $limit = query?.$limit;
        let limit = paginationOptions?.default;
        if (paginationOptions?.max) {
            if ($limit) {
                limit = (0, lodash_1.min)([$limit, paginationOptions.max]);
            }
            else {
                limit = paginationOptions.max;
            }
            // eslint-disable-next-line brace-style
        }
        // 0 is a special $limit value that indicates that only a counting query should be performed
        // don't treat it the same as other falsey values
        else if ($limit || $limit === 0) {
            limit = params.query?.$limit;
        }
        const findOptions = this.translateFeathersQueryToMikroORMFindOptions(params.query || {});
        // if limit is 0, only run a count query
        // and return a Paginated object with the count and an empty data array
        if (limit === 0) {
            const total = await this._findCount(query || {});
            return {
                total,
                data: [],
                limit,
                skip: findOptions.offset || 0
            };
        }
        // if limit is set, run a findAndCount query and return a Paginated object
        if (limit) {
            const [data, total] = await this.em.findAndCount(this.Entity, query, findOptions);
            return {
                total,
                limit,
                skip: findOptions.offset || 0,
                data
            };
        }
        // if limit is not set, run an unpaginated find query
        return await this._findUnpaginated(params);
    }
    async _findCount(query) {
        const count = await this.em.count(this.Entity, query);
        return count;
    }
    async _findUnpaginated(params) {
        const entities = await this.em.find(this.Entity, params.query);
        return entities;
    }
    async _findAll() {
        const entities = await this.em.find(this.Entity, {});
        return entities;
    }
    // get helpers
    async _getById(id) {
        const query = {
            [this.id]: id
        };
        const entity = await this.em.findOne(this.Entity, query);
        if (!entity) {
            throw new lib_1.NotFound();
        }
        return entity;
    }
    async _getByParams(params) {
        const query = params.query;
        const entity = await this.em.findOne(this.Entity, query);
        if (!entity) {
            throw new lib_1.NotFound();
        }
        return entity;
    }
    // create helpers
    async _createOne(data, _params) {
        const createdEntity = this.em.create(this.Entity, data);
        await this.em.persistAndFlush(createdEntity);
        return createdEntity;
    }
    async _createMany(data, _params) {
        const createdEntities = data.map((entityData) => this.em.create(this.Entity, entityData));
        await this.em.persistAndFlush(createdEntities);
        return createdEntities;
    }
    // update helpers
    // patch helpers
    async _patchById(id, data, params) {
        if (Array.isArray(data)) {
            throw new lib_1.BadRequest('Cannot patch multiple entites when id is set.');
        }
        const entity = await this._get(id, params);
        this.em.assign(entity, data);
        await this.em.flush();
        return entity;
    }
    async _patchByParams(data, params) {
        const entities = await this._findUnpaginated(params);
        for (const entity of entities) {
            const changeSet = Array.isArray(data)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? data.find((item) => item[this.id] === entity[this.id])
                : data;
            this.em.assign(entity, changeSet);
        }
        await this.em.flush();
        return entities;
    }
    // remove helpers
    async _removeById(id, params) {
        const entity = await this._get(id, params);
        await this.em.removeAndFlush(entity);
        return entity;
    }
    async _removeByParams(params) {
        const entities = await this._findUnpaginated(params);
        await this.em.removeAndFlush(entities);
        return entities;
    }
    // general helpers
    stripSpecialFeathersQuery(query) {
        /**
         * params used by the feathers query syntax that are not understood by MikroORM
         */
        const specialFeathersSyntax = [
            '$limit',
            '$skip',
            '$sort',
            '$select'
        ];
        return (0, lodash_1.omit)(query, specialFeathersSyntax);
    }
    translateFeathersQueryToMikroORMFindOptions(query) {
        return {
            ...this.stripSpecialFeathersQuery(query),
            orderBy: query.$sort,
            offset: query.$skip,
            fields: query.$select
        };
    }
}
exports.MikroORMAdapter = MikroORMAdapter;
class MikroORMService extends MikroORMAdapter {
    async find(params) {
        const sanitizedParams = await this.sanitizeParams(params);
        return this._find(sanitizedParams);
    }
    async get(id, params) {
        const sanitizedParams = await this.sanitizeParams(params);
        return this._get(id, sanitizedParams);
    }
    async create(data, params) {
        if (!Array.isArray(data) && !this.allowsMulti('create', params)) {
            throw new lib_1.MethodNotAllowed('Can not create multiple entries');
        }
        return this._create(data, params);
    }
    async update(id, data, params) {
        const sanitizedParams = await this.sanitizeParams(params);
        return this._update(id, data, sanitizedParams);
    }
    async patch(id, data, params) {
        if (id === null && !Array.isArray(data) && !this.allowsMulti('patch', params)) {
            throw new lib_1.MethodNotAllowed('Can not patch multiple entries');
        }
        const sanitizedParams = await this.sanitizeParamsAndRemoveLimit(params);
        return this._patch(id, data, sanitizedParams);
    }
    async remove(id, params) {
        if (id === null && !this.allowsMulti('remove', params)) {
            throw new lib_1.MethodNotAllowed('Can not remove multiple entries');
        }
        const sanitizedParams = await this.sanitizeParamsAndRemoveLimit(params);
        return this._remove(id, sanitizedParams);
    }
    async sanitizeParams(params) {
        const sanitizedParams = {
            ...params,
            query: await this.sanitizeQuery(params)
        };
        return sanitizedParams;
    }
    async sanitizeParamsAndRemoveLimit(params) {
        const { 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        $limit, ...query } = await this.sanitizeQuery(params);
        const sanitizedParams = {
            ...params,
            query
        };
        return sanitizedParams;
    }
}
exports.MikroORMService = MikroORMService;
function createService(options) {
    return new MikroORMService(options);
}
exports.createService = createService;
// import { AdapterService, ServiceOptions } from '@feathersjs/adapter-commons';
// import { NullableId, Paginated, PaginationOptions, Params } from '@feathersjs/feathers';
// import { EntityRepository, MikroORM, wrap, Utils, FilterQuery, FindOptions, QueryOrder, QueryOrderNumeric, EntityData } from '@mikro-orm/core';
// import { NotFound } from '@feathersjs/errors';
// import { isEmpty, min, omit, pick } from 'lodash';
// interface MikroOrmServiceOptions<T = any> extends Partial<ServiceOptions> {
//   Entity: new (...args: any[]) => T; // constructor for instances of T
//   orm: MikroORM;
// }
// const feathersSpecialQueryParameters = [
//   '$limit',
//   '$skip',
//   '$sort',
//   '$select',
//   '$in',
//   '$nin',
//   '$lte',
//   '$lt',
//   '$gte',
//   '$gt',
//   '$ne',
//   '$or'
// ];
// export class Service<T extends object = any> extends AdapterService {
//   protected orm: MikroORM;
//   protected Entity: new (...args: any[]) => T;
//   protected name: string;
//   protected paginationOptions?: Partial<PaginationOptions>;
//   constructor (options: MikroOrmServiceOptions<T>) {
//     const { orm, Entity, paginate } = options;
//     super(options);
//     this.Entity = Entity;
//     this.orm = orm;
//     this.paginationOptions = paginate;
//     const name = Utils.className(Entity);
//     this.name = name;
//   }
//   async get (id: NullableId, params?: Params): Promise<T> {
//     const where = params?.where || params?.query?.where;
//     const entity = await this._getEntityRepository().findOne(id || where, params?.populate);
//     if (!entity) {
//       throw new NotFound(`${this.name} not found.`);
//     }
//     return entity;
//   }
//   async find (params?: Params): Promise<T[] | Paginated<T>> {
//     if (!params) {
//       return this._getEntityRepository().findAll(params);
//     }
//     // mikro-orm filter query is query params minus special feathers query params
//     const query = omit(params.query, feathersSpecialQueryParameters) as FilterQuery<T>;
//     // paginate object from params overrides default pagination options set at initialization
//     const paginationOptions = { ...this.paginationOptions, ...params.paginate };
//     /**
//      * limit is
//      * - the lower value of params.query.$limit and paginationOptions.max, if both are present
//      * - params.query.$limit, if paginationOptions.max is not present
//      * - paginationOptions.default (may be undefined), if params.query.$limit is not present
//      */
//     let limit: number | undefined = paginationOptions?.default;
//     if (paginationOptions?.max) {
//       if (params.query?.$limit) {
//         limit = min([params.query.$limit, paginationOptions.max]);
//       } else {
//         limit = paginationOptions.max;
//       }
//       // 0 is a special $limit value, more on that later
//     } else if (params.query?.$limit || params.query?.$limit === 0) {
//       limit = params.query?.$limit;
//     }
//     const queryOptions = this._translateFeathersQueryToFindOptions(pick(params.query, feathersSpecialQueryParameters));
//     const options = {
//       ...queryOptions,
//       ...params.options,
//       limit
//     };
//     // if limit is 0, only run a counting query
//     // and return a Paginated object with the count and an empty data array
//     if (limit === 0) {
//       return await this._findCount(query, options.offset);
//     }
//     // if limit is set, run a findAndCount query and return a Paginated object
//     if (limit) {
//       return await this._findPaginated(query, options);
//     } else {
//       // if no limit is set, run a regular find query and return the results
//       // return await this.repository.find(query, options);
//       return await this._getEntityRepository().find(query, options);
//     }
//   }
//   async create (data: EntityData<T>, params?: Params): Promise<T> {
//     const entity = new (this.Entity as any)(data);
//     await this._getEntityRepository().persistAndFlush(entity);
//     return entity;
//   }
//   async patch (id: NullableId, data: EntityData<T>, params?: Params): Promise<T | T[]> {
//     const where = params?.where || id;
//     const entityRepository = this._getEntityRepository();
//     if (id) {
//       const entity = await entityRepository.findOne(where, params?.populate);
//       if (!entity) {
//         throw new NotFound(`cannot patch ${this.name}, entity not found`);
//       }
//       wrap(entity).assign(data);
//       await entityRepository.persistAndFlush(entity);
//       return entity;
//     }
//     /**
//      * batch patch
//      */
//     // Note: could use this below helper but only returns number of records updated... not the records themselves so would have to query fo them after the fact. And this doesn't take the state in memory / ID map into account.
//     // const result = await this.orm.em.nativeUpdate(this.Entity, where, data, options);
//     // For the reasons stated above opting to go with the less efficient but easy to handle approach of finding then batch updating. Worth noting that the updates are actually batched.
//     const entities = await this.find(params) as any as T[]; // Note: a little hacky but pagination should never really be used for patch operations
//     if (isEmpty(entities)) {
//       throw new NotFound('cannot patch query, returned empty result set');
//     }
//     // here can enforce that the result count is the same as in $in array length, but unsure how to get the <some_attribute> from the query
//     // if (params?.query?.<some_attribute>.$in?.length !== entities.length) {}
//     // However, after further though this approach actually would not work thanks the query possibly having many $ins in it a logic operator. Leaving here as a note.
//     for (const entity of entities) {
//       wrap(entity).assign(data);
//     }
//     await entityRepository.persistAndFlush(entities);
//     return entities;
//   }
//   async remove (id: NullableId, params?: Params): Promise<T | { success: boolean }> {
//     if (id) {
//       // removing a single entity by id
//       let entity: T;
//       try {
//         // repository methods often complain about argument types being incorrect even when they're not
//         // `string` and `number` types _should_ be assignable to `FilterQuery`, but they aren't.
//         // comment by package author/maintainer: https://github.com/mikro-orm/mikro-orm/issues/1405#issuecomment-775841265
//         entity = await this._getEntityRepository().findOneOrFail(id as FilterQuery<T>);
//       } catch (e) {
//         throw new NotFound(`${this.name} not found.`);
//       }
//       // await this.repository.removeAndFlush(entity);
//       await this._getEntityRepository().removeAndFlush(entity);
//       return entity;
//     } else if (params?.query || params?.where) {
//       const query = params?.query || params?.where;
//       // removing many entities by a query
//       const entityRepo = this._getEntityRepository();
//       const deletedCount = await entityRepo.nativeDelete(query);
//       await entityRepo.flush();
//       return deletedCount > 0 ? { success: true } : { success: false };
//     }
//     return { success: false };
//   }
//   /**
//    * Helper to got the EntityRepository with fresh request context via Entity Manager forking
//    * ref: https://mikro-orm.io/docs/identity-map/#forking-entity-manager, https://mikro-orm.io/docs/identity-map/
//    * @returns
//    */
//   protected _getEntityRepository (): EntityRepository<T> {
//     // forking the Entity Manager in order to ensure a unique identity map per each request. ref: https://mikro-orm.io/docs/identity-map/
//     const em = this.orm.em.fork();
//     return em.getRepository<T, EntityRepository<T>>(this.name) as EntityRepository<T>;
//   }
//   /**
//  * helper to get a total count of entities matching a query
//  * @param query the query to match by
//  * @param skip the $skip value from query params. kind of nonsensical and will not be used in the actual query, but is required in the return type. default 0.
//  * @returns Promise<Paginated<never>> a feathers Paginated object with the total count
//  */
//   private async _findCount (query: FilterQuery<T>, skip = 0): Promise<Paginated<never>> {
//     const total = await this._getEntityRepository().count(query);
//     return {
//       total,
//       limit: 0,
//       skip,
//       data: []
//     };
//   }
//   /**
//    * helper to get paginated results matching a query
//    * @param query the filter query to match by
//    * @param options find options
//    * @returns Promise<Paginated<T>> a feathers Paginated object with the query results
//    */
//   private async _findPaginated (query: FilterQuery<T>, options: FindOptions<T>): Promise<Paginated<T>> {
//     // const [data, total] = await this.repository.findAndCount(query, options);
//     const [data, total] = await this._getEntityRepository().findAndCount(query, options);
//     return {
//       total,
//       limit: options.limit as number,
//       skip: options.offset || 0,
//       data
//     };
//   }
//   /**
//    * helper to translate feathers query syntax to mikro-orm options syntax
//    * @param query feathers query
//    * @returns FindOptions mikro-orm FindOptions
//    */
//   private _translateFeathersQueryToFindOptions (query: any): FindOptions<T> {
//     return {
//       ...omit(query, '$sort', '$skip', '$select', '$limit'),
//       orderBy: query.$sort,
//       offset: query.$skip,
//       fields: query.$select
//     };
//   }
// }
// export default function<T extends object = any> (options: MikroOrmServiceOptions<T>): Service<T> {
//   return new Service<T>(options);
// }
