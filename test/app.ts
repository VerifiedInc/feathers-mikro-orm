import { feathers } from '@feathersjs/feathers';
import { MikroORM, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import { createService } from '../src/';
import { Book } from './entities/Book';
import { BaseEntity } from './entities/BaseEntity';
import { mikroOrm } from './mikro-orm';
import { Application, ServiceTypes } from './declarations';

export async function setupApp (): Promise<Application> {
  const app = feathers<ServiceTypes, any>() as Application;

  await mikroOrm(app);

  const orm = app.get('orm');

  const schemaGenerator = orm.getSchemaGenerator();
  await schemaGenerator.ensureDatabase();

  const updateSchemaSql = await schemaGenerator.getUpdateSchemaSQL();

  await schemaGenerator.execute(updateSchemaSql);

  const bookService = createService({
    Entity: Book,
    em: orm.em
  });

  app.use('/book', bookService);

  return app;
}
