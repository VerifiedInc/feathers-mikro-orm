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
        this.repository = this.orm.em.getRepository(name);
        this.name = name;
    }
    async get(id, params) {
        var _a;
        const where = (params === null || params === void 0 ? void 0 : params.where) || ((_a = params === null || params === void 0 ? void 0 : params.query) === null || _a === void 0 ? void 0 : _a.where);
        const entity = await this.orm.em.findOne(this.name, id || where, params === null || params === void 0 ? void 0 : params.populate);
        if (!entity) {
            throw new errors_1.NotFound(`${this.name} not found.`);
        }
        return entity;
    }
    async find(params) {
        var _a, _b, _c, _d, _e;
        if (!params) {
            return this.repository.findAll(params);
        }
        // mikro-orm filter query is query params minus special feathers query params
        const query = lodash_1.omit(params.query, feathersSpecialQueryParameters);
        // paginate object from params overrides default pagination options set at initialization
        const paginationOptions = { ...this.paginationOptions, ...params.paginate };
        /**
         * limit is
         * - the lower value of params.query.$limit and paginationOptions.max, if both are present
         * - params.query.$limit, if paginationOptions.max is not present
         * - paginationOptions.default (may be undefined), if params.query.$limit is not present
         */
        let limit = paginationOptions === null || paginationOptions === void 0 ? void 0 : paginationOptions.default;
        if (paginationOptions === null || paginationOptions === void 0 ? void 0 : paginationOptions.max) {
            if ((_a = params.query) === null || _a === void 0 ? void 0 : _a.$limit) {
                limit = lodash_1.min([params.query.$limit, paginationOptions.max]);
            }
            else {
                limit = paginationOptions.max;
            }
            // 0 is a special $limit value, more on that later
        }
        else if (((_b = params.query) === null || _b === void 0 ? void 0 : _b.$limit) || ((_c = params.query) === null || _c === void 0 ? void 0 : _c.$limit) === 0) {
            limit = (_d = params.query) === null || _d === void 0 ? void 0 : _d.$limit;
        }
        const offset = ((_e = params.query) === null || _e === void 0 ? void 0 : _e.$skip) || 0;
        const options = { limit, offset };
        // if limit is 0, only run a counting query
        // and return a Paginated object with the count and an empty data array
        if (limit === 0) {
            return await this._findCount(query, offset);
        }
        // if limit is set, run a findAndCount query and return a Paginated object
        if (limit) {
            return await this._findPaginated(query, options);
        }
        else {
            // if no limit is set, run a regular find query and return the results
            return await this.repository.find(query, options);
        }
    }
    async create(data, params) {
        const entity = new this.Entity(data);
        await this.repository.persistAndFlush(entity);
        return entity;
    }
    async patch(id, data, params) {
        const where = (params === null || params === void 0 ? void 0 : params.where) || id;
        const entity = await this.repository.findOne(where);
        if (!entity) {
            throw new errors_1.NotFound(`cannot patch ${this.name}, entity not found`);
        }
        core_1.wrap(entity).assign(data);
        await this.repository.persistAndFlush(entity);
        return entity;
    }
    async remove(id, params) {
        if (id) {
            // removing a single entity by id
            let entity;
            try {
                // repository methods often complain about argument types being incorrect even when they're not
                // `string` and `number` types _should_ be assignable to `FilterQuery`, but they aren't.
                // comment by package author/maintainer: https://github.com/mikro-orm/mikro-orm/issues/1405#issuecomment-775841265
                entity = await this.repository.findOneOrFail(id);
            }
            catch (e) {
                throw new errors_1.NotFound(`${this.name} not found.`);
            }
            await this.repository.removeAndFlush(entity);
            return entity;
        }
        else {
            // removing many entities by a query
            await this.orm.em.nativeDelete(this.Entity, params === null || params === void 0 ? void 0 : params.where);
            await this.orm.em.flush();
            return { success: true };
        }
    }
    /**
   * helper to get a total count of enties matching a query
   * @param query the query to match by
   * @param skip the $skip value from query params. kind of nonsensical and will not be used in the actual query, but is required in the return type. default 0.
   * @returns Promise<Paginated<never>> a feathers Paginated object with the total count
   */
    async _findCount(query, skip = 0) {
        const total = await this.repository.count(query);
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
        const [data, total] = await this.repository.findAndCount(query, options);
        return {
            total,
            limit: options.limit,
            skip: options.offset || 0,
            data
        };
    }
}
exports.Service = Service;
function default_1(options) {
    return new Service(options);
}
exports.default = default_1;
