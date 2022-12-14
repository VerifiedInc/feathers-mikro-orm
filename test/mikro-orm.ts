import { MikroORM } from '@mikro-orm/core';

import type { Application } from './declarations';
import { config } from './mikro-orm.config';

declare module './declarations' {
  interface Configuration {
    orm: MikroORM;
  }
}

export const mikroOrm = async (app: Application): Promise<void> => {
  const orm = await MikroORM.init(config);

  app.set('orm', orm);
};
