import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

import type { Application } from './declarations';
import { config } from './mikro-orm.config';

declare module './declarations' {
  interface Configuration {
    orm: MikroORM;
  }
}

export const mikroOrm = async (app: Application): Promise<void> => {
  const orm = await MikroORM.init<PostgreSqlDriver>(config);

  app.set('orm', orm);
};
