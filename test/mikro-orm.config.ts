import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { BaseEntity } from './entities/BaseEntity';
import { Book } from './entities/Book';

export const config: Options<PostgreSqlDriver> = {
  type: 'postgresql',
  dbName: 'feathers_mikro_orm_test',
  host: 'localhost',
  user: 'unumid',
  entities: [Book, BaseEntity],
  debug: true,
  metadataProvider: TsMorphMetadataProvider
};
