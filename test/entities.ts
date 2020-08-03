import { Entity, Property, PrimaryKey, UuidEntity } from 'mikro-orm';
import { v4 } from 'uuid';

@Entity()
export class Book implements UuidEntity<Book> {
  @PrimaryKey()
  uuid = v4();

  @Property()
  title!: string;

  constructor (opts: { title: string }) {
    this.title = opts.title;
  }
}
