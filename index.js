"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const errors_1 = require("@feathersjs/errors");
class MikroOrmService extends adapter_commons_1.AdapterService {
    constructor(options) {
        super(options);
        this.Entity = options.Entity;
        this.repository = options.repository;
        this.name = options.name;
    }
    setup(app) {
        this.app = app;
    }
    async get(id, params) {
        const where = params && (params.where || (params.query && params.query.where));
        const entity = await this.repository.findOne(id || where);
        if (!entity) {
            throw new errors_1.NotFound(`${this.name} not found`);
        }
        return entity;
    }
    async find(params) {
        if (!params) {
            return this.repository.findAll();
        }
        const entities = await this.repository.find(params.where, params.options);
        return entities;
    }
    async create(data, params) {
        const entity = new this.Entity(data);
        await this.repository.persistAndFlush(entity);
        return entity;
    }
    async patch(id, data, params) {
        var _a;
        const where = ((_a = params) === null || _a === void 0 ? void 0 : _a.where) || id;
        const entity = await this.repository.findOne(where);
        if (!entity) {
            throw new errors_1.NotFound(`cannot patch ${this.name}, entity not found`);
        }
        entity.assign(data);
        await this.repository.persistAndFlush(entity);
        return entity;
    }
    async remove(id, params) {
        var _a;
        const where = ((_a = params) === null || _a === void 0 ? void 0 : _a.where) || id;
        const entity = await this.repository.findOne(where);
        if (!entity) {
            throw new errors_1.NotFound(`cannot remove ${this.name}, entity not found`);
        }
        await this.repository.removeAndFlush(entity);
        return entity;
    }
}
exports.MikroOrmService = MikroOrmService;
function default_1(options) {
    return new MikroOrmService(options);
}
exports.default = default_1;
