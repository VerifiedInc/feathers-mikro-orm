"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const core_1 = require("@mikro-orm/core");
const errors_1 = require("@feathersjs/errors");
class Service extends adapter_commons_1.AdapterService {
    constructor(options) {
        const { orm, Entity } = options;
        super(options);
        this.Entity = Entity;
        this.orm = orm;
        const name = core_1.Utils.className(Entity);
        this.repository = this.orm.em.getRepository(name);
        this.name = name;
    }
    async get(id, params) {
        var _a;
        const where = (params === null || params === void 0 ? void 0 : params.where) || ((_a = params === null || params === void 0 ? void 0 : params.query) === null || _a === void 0 ? void 0 : _a.where);
        const entity = await this.orm.em.findOne(this.name, id || where);
        if (!entity) {
            throw new errors_1.NotFound(`${this.name} not found.`);
        }
        return entity;
    }
    async find(params) {
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
}
exports.Service = Service;
function default_1(options) {
    return new Service(options);
}
exports.default = default_1;
