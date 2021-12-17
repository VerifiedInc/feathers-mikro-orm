import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey()
  uuid = v4();

  @Property({ columnType: 'timestamptz(6)' })
  createdAt = new Date();

  @Property({ columnType: 'timestamptz(6)', onUpdate: () => new Date() })
  updatedAt = new Date();
}
