import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Book extends BaseEntity {
  @Property()
  title: string;

  @Property()
  popularity?: number;

  constructor (options: { title: string; popularity?: number }) {
    super();
    this.title = options.title;
    this.popularity = options.popularity || null;
  }
}
