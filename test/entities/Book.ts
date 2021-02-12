import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Book extends BaseEntity {
  @Property()
  title: string;

  constructor (options: { title: string }) {
    super();
    this.title = options.title;
  }
}
