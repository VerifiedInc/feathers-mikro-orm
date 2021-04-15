import feathers, { Application } from '@feathersjs/feathers';
import { MikroORM, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import createService from '../src/';
import { Book } from './entities/Book';
import { BaseEntity } from './entities/BaseEntity';

export async function setupApp (): Promise<Application> {
  const app = feathers();

  const config: Options = {
    type: 'postgresql',
    dbName: 'feathers_mikro_orm_test',
    host: 'localhost',
    entities: [Book, BaseEntity],
    debug: true,
    metadataProvider: TsMorphMetadataProvider,
    user: 'raysmets'
  };

  const orm = await MikroORM.init(config);
  app.set('orm', orm);

  const schemaGenerator = orm.getSchemaGenerator();
  await schemaGenerator.ensureDatabase();

  const updateSchemaSql = await schemaGenerator.getUpdateSchemaSQL();

  await schemaGenerator.execute(updateSchemaSql);

  const bookService = createService({
    Entity: Book,
    orm
  });

  app.use('/book', bookService);

  return app;
}
