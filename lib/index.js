"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const core_1 = require("@mikro-orm/core");
const errors_1 = require("@feathersjs/errors");
class Service extends adapter_commons_1.AdapterService {
    constructor(options) {
        super(options);
        this.Entity = options.Entity;
        this.orm = options.orm;
        this.repository = this.orm.em.getRepository(options.name);
        this.name = options.name;
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
        const where = (params === null || params === void 0 ? void 0 : params.where) || id;
        const entity = await this.get(where);
        // await this.orm.em.nativeDelete(this.Entity, where);
        // await this.orm.em.flush();
        await this.repository.removeAndFlush(entity);
        return entity;
    }
}
exports.Service = Service;
function default_1(options) {
    return new Service(options);
}
exports.default = default_1;
