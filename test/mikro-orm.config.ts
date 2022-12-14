import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { BaseEntity } from './entities/BaseEntity';
import { Book } from './entities/Book';

export const config: Options = {
  type: 'postgresql',
  dbName: 'feathers_mikro_orm_test',
  host: 'localhost',
  entities: [Book, BaseEntity],
  debug: true,
  metadataProvider: TsMorphMetadataProvider
};
