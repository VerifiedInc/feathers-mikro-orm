import { AdapterBase, AdapterServiceOptions, PaginationOptions, PaginationParams } from '@feathersjs/adapter-commons';
import { Id, NullableId, Paginated, Params } from '@feathersjs/feathers';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
export interface MikroORMServiceOptions extends AdapterServiceOptions {
    em: EntityManager;
    Entity: any;
}
export declare class MikroORMAdapter<Result extends object = any, Data extends RequiredEntityData<Result> = RequiredEntityData<Result>, ServiceParams extends Params = Params> extends AdapterBase<Result, Data, ServiceParams, MikroORMServiceOptions> {
    protected readonly em: EntityManager;
    protected readonly Entity: any;
    protected readonly paginate?: PaginationParams;
    constructor(options: MikroORMServiceOptions);
    $find(_params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    $find(_params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    _find(_params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    _find(_params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    $get(_id: Id, _params?: ServiceParams): Promise<Result>;
    _get(id: NullableId, params?: ServiceParams): Promise<Result>;
    $create(data: Partial<Data>, params?: ServiceParams): Promise<Result>;
    $create(data: Partial<Data>[], params?: ServiceParams): Promise<Result[]>;
    _create(data: Data, params?: ServiceParams): Promise<Result>;
    _create(data: Data[], params?: ServiceParams): Promise<Result[]>;
    _create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]>;
    $update(_id: Id, _data: Data, _params?: ServiceParams): Promise<Result>;
    _update(id: Id, data: Data, _params?: ServiceParams): Promise<Result>;
    $patch(id: null, data: Partial<Data>, params?: ServiceParams): Promise<Result[]>;
    $patch(id: Id, data: Partial<Data>, params?: ServiceParams): Promise<Result>;
    _patch(id: null, data: Data, params?: ServiceParams): Promise<Result[]>;
    _patch(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    _patch(id: NullableId, data: Data | Data[], params?: ServiceParams): Promise<Result>;
    $remove(id: null, params?: ServiceParams): Promise<Result[]>;
    $remove(id: Id, params?: ServiceParams): Promise<Result>;
    $remove(id: NullableId, _params?: ServiceParams): Promise<Result | Result[]>;
    _remove(id: null, params?: ServiceParams): Promise<Result[]>;
    _remove(id: Id, params?: ServiceParams): Promise<Result>;
    _remove(id: NullableId, _params?: ServiceParams): Promise<Result | Result[]>;
    private _findPaginated;
    private _findCount;
    private _findUnpaginated;
    private _findAll;
    private _getById;
    private _getByParams;
    private _createOne;
    private _createMany;
    private _patchById;
    private _patchByParams;
    private _removeById;
    private _removeByParams;
    private stripSpecialFeathersQuery;
    private translateFeathersQueryToMikroORMFindOptions;
}
export declare class MikroORMService<Result extends object = any, Data extends RequiredEntityData<Result> = RequiredEntityData<Result>, ServiceParams extends Params = Params> extends MikroORMAdapter<Result, Data, ServiceParams> {
    find(params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    find(params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    find(params?: ServiceParams): Promise<Result[] | Paginated<Result>>;
    get(id: NullableId, params?: ServiceParams): Promise<Result>;
    create(data: Data, params?: ServiceParams): Promise<Result>;
    create(data: Data[], params?: ServiceParams): Promise<Result[]>;
    update(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    patch(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    patch(id: null, data: Data[], params?: ServiceParams): Promise<Result[]>;
    patch(id: NullableId, data: Data | Data[], params?: ServiceParams): Promise<Result>;
    remove(id: Id, params?: ServiceParams): Promise<Result>;
    remove(id: null, params?: ServiceParams): Promise<Result[]>;
    private sanitizeParams;
    private sanitizeParamsAndRemoveLimit;
}
export declare function createService<Result extends object, Data extends RequiredEntityData<Result> = RequiredEntityData<Result>, ServiceParams extends Params = Params>(options: MikroORMServiceOptions): MikroORMService<Result, Data, ServiceParams>;
