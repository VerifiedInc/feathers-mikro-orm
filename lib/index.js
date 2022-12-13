"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const core_1 = require("@mikro-orm/core");
const errors_1 = require("@feathersjs/errors");
const lodash_1 = require("lodash");
const feathersSpecialQueryParameters = [
    '$limit',
    '$skip',
    '$sort',
    '$select',
    '$in',
    '$nin',
    '$lte',
    '$lt',
    '$gte',
    '$gt',
    '$ne',
    '$or'
];
class Service extends adapter_commons_1.AdapterService {
    constructor(options) {
        const { orm, Entity, paginate } = options;
        super(options);
        this.Entity = Entity;
        this.orm = orm;
        this.paginationOptions = paginate;
        const name = core_1.Utils.className(Entity);
        this.name = name;
    }
    async get(id, params) {
        const where = params?.where || params?.query?.where;
        const entity = await this._getEntityRepository().findOne(id || where, params?.populate);
        if (!entity) {
            throw new errors_1.NotFound(`${this.name} not found.`);
        }
        return entity;
    }
    async find(params) {
        if (!params) {
            return this._getEntityRepository().findAll(params);
        }
        // mikro-orm filter query is query params minus special feathers query params
        const query = (0, lodash_1.omit)(params.query, feathersSpecialQueryParameters);
        // paginate object from params overrides default pagination options set at initialization
        const paginationOptions = { ...this.paginationOptions, ...params.paginate };
        /**
         * limit is
         * - the lower value of params.query.$limit and paginationOptions.max, if both are present
         * - params.query.$limit, if paginationOptions.max is not present
         * - paginationOptions.default (may be undefined), if params.query.$limit is not present
         */
        let limit = paginationOptions?.default;
        if (paginationOptions?.max) {
            if (params.query?.$limit) {
                limit = (0, lodash_1.min)([params.query.$limit, paginationOptions.max]);
            }
            else {
                limit = paginationOptions.max;
            }
            // 0 is a special $limit value, more on that later
        }
        else if (params.query?.$limit || params.query?.$limit === 0) {
            limit = params.query?.$limit;
        }
        const queryOptions = this._translateFeathersQueryToFindOptions((0, lodash_1.pick)(params.query, feathersSpecialQueryParameters));
        const options = {
            ...queryOptions,
            ...params.options,
            limit
        };
        // if limit is 0, only run a counting query
        // and return a Paginated object with the count and an empty data array
        if (limit === 0) {
            return await this._findCount(query, options.offset);
        }
        // if limit is set, run a findAndCount query and return a Paginated object
        if (limit) {
            return await this._findPaginated(query, options);
        }
        else {
            // if no limit is set, run a regular find query and return the results
            // return await this.repository.find(query, options);
            return await this._getEntityRepository().find(query, options);
        }
    }
    async create(data, params) {
        const entity = new this.Entity(data);
        await this._getEntityRepository().persistAndFlush(entity);
        return entity;
    }
    async patch(id, data, params) {
        const where = params?.where || id;
        const entityRepository = this._getEntityRepository();
        if (id) {
            const entity = await entityRepository.findOne(where, params?.populate);
            if (!entity) {
                throw new errors_1.NotFound(`cannot patch ${this.name}, entity not found`);
            }
            (0, core_1.wrap)(entity).assign(data);
            await entityRepository.persistAndFlush(entity);
            return entity;
        }
        /**
         * batch patch
         */
        // Note: could use this below helper but only returns number of records updated... not the records themselves so would have to query fo them after the fact. And this doesn't take the state in memory / ID map into account.
        // const result = await this.orm.em.nativeUpdate(this.Entity, where, data, options);
        // For the reasons stated above opting to go with the less efficient but easy to handle approach of finding then batch updating. Worth noting that the updates are actually batched.
        const entities = await this.find(params); // Note: a little hacky but pagination should never really be used for patch operations
        if ((0, lodash_1.isEmpty)(entities)) {
            throw new errors_1.NotFound('cannot patch query, returned empty result set');
        }
        // here can enforce that the result count is the same as in $in array length, but unsure how to get the <some_attribute> from the query
        // if (params?.query?.<some_attribute>.$in?.length !== entities.length) {}
        // However, after further though this approach actually would not work thanks the query possibly having many $ins in it a logic operator. Leaving here as a note.
        for (const entity of entities) {
            (0, core_1.wrap)(entity).assign(data);
        }
        await entityRepository.persistAndFlush(entities);
        return entities;
    }
    async remove(id, params) {
        if (id) {
            // removing a single entity by id
            let entity;
            try {
                // repository methods often complain about argument types being incorrect even when they're not
                // `string` and `number` types _should_ be assignable to `FilterQuery`, but they aren't.
                // comment by package author/maintainer: https://github.com/mikro-orm/mikro-orm/issues/1405#issuecomment-775841265
                entity = await this._getEntityRepository().findOneOrFail(id);
            }
            catch (e) {
                throw new errors_1.NotFound(`${this.name} not found.`);
            }
            // await this.repository.removeAndFlush(entity);
            await this._getEntityRepository().removeAndFlush(entity);
            return entity;
        }
        else if (params?.query || params?.where) {
            const query = params?.query || params?.where;
            // removing many entities by a query
            const entityRepo = this._getEntityRepository();
            const deletedCount = await entityRepo.nativeDelete(query);
            await entityRepo.flush();
            return deletedCount > 0 ? { success: true } : { success: false };
        }
        return { success: false };
    }
    /**
     * Helper to got the EntityRepository with fresh request context via Entity Manager forking
     * ref: https://mikro-orm.io/docs/identity-map/#forking-entity-manager, https://mikro-orm.io/docs/identity-map/
     * @returns
     */
    _getEntityRepository() {
        // forking the Entity Manager in order to ensure a unique identity map per each request. ref: https://mikro-orm.io/docs/identity-map/
        const em = this.orm.em.fork();
        return em.getRepository(this.name);
    }
    /**
   * helper to get a total count of entities matching a query
   * @param query the query to match by
   * @param skip the $skip value from query params. kind of nonsensical and will not be used in the actual query, but is required in the return type. default 0.
   * @returns Promise<Paginated<never>> a feathers Paginated object with the total count
   */
    async _findCount(query, skip = 0) {
        const total = await this._getEntityRepository().count(query);
        return {
            total,
            limit: 0,
            skip,
            data: []
        };
    }
    /**
     * helper to get paginated results matching a query
     * @param query the filter query to match by
     * @param options find options
     * @returns Promise<Paginated<T>> a feathers Paginated object with the query results
     */
    async _findPaginated(query, options) {
        // const [data, total] = await this.repository.findAndCount(query, options);
        const [data, total] = await this._getEntityRepository().findAndCount(query, options);
        return {
            total,
            limit: options.limit,
            skip: options.offset || 0,
            data
        };
    }
    /**
     * helper to translate feathers query syntax to mikro-orm options syntax
     * @param query feathers query
     * @returns FindOptions mikro-orm FindOptions
     */
    _translateFeathersQueryToFindOptions(query) {
        return {
            ...(0, lodash_1.omit)(query, '$sort', '$skip', '$select', '$limit'),
            orderBy: query.$sort,
            offset: query.$skip,
            fields: query.$select
        };
    }
}
exports.Service = Service;
function default_1(options) {
    return new Service(options);
}
exports.default = default_1;
