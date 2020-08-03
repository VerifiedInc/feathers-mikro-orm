import feathers, { Application } from '@feathersjs/feathers';
import { MikroORM } from 'mikro-orm';

import createService from '../';

import { Book } from './entities';

export async function setupApp (): Promise<Application> {
  const app = feathers();

  const mikroOrmConfig = {
    type: 'postgresql',
    dbName: 'feathers_mikro_orm_test',
    host: 'localhost',
    entities: [Book],
    debug: false
  };

  const mikro = await MikroORM.init(mikroOrmConfig);
  app.set('mikro', mikro);

  const schemaGenerator = mikro.getSchemaGenerator();
  await schemaGenerator.ensureDatabase();

  const updateSchemaSql = await schemaGenerator.getUpdateSchemaSQL();

  await schemaGenerator.execute(updateSchemaSql);

  const bookRepository = mikro.em.getRepository(Book);
  const bookService = createService({
    repository: bookRepository,
    Entity: Book,
    name: 'Book'
  });

  app.use('/book', bookService);

  return app;
}
