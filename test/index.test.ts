import { Application } from '@feathersjs/feathers';
import { NotFound } from '@feathersjs/errors';
import { setupApp } from './setupApp';

describe('feathers-mikro-orm', () => {
  let app: Application;
  beforeAll(async () => {
    app = await setupApp();
  });

  it('defines a service', () => {
    expect(app.service('book')).toBeDefined();
  });

  describe('the book service', () => {
    let service: any;

    beforeAll(() => {
      service = app.service('book');
    });

    beforeEach(async () => {
      const mikro = app.get('mikro');
      const connection = mikro.em.getConnection();
      await connection.execute('DELETE FROM "book";');
    });

    it('creates a book', async () => {
      const bookOpts = { title: 'test title' };
      const book = await service.create(bookOpts);
      expect(book).toBeDefined();
    });

    it('gets a created book by id', async () => {
      const bookOpts = { title: 'test title' };
      const { uuid } = await service.create(bookOpts);
      const book = await service.get(uuid);
      expect(book).toBeDefined();
    });

    it('finds all created books', async () => {
      const opts1 = { title: 'test title 1' };
      const opts2 = { title: 'test title 2' };

      await service.create(opts1);
      await service.create(opts2);

      const books = await service.find();
      expect(books.length).toEqual(2);
    });

    it('patches a book by uuid', async () => {
      const opts = { title: 'test title' };
      const book = await service.create(opts);

      await service.patch(book.uuid, { title: 'updated title' });
      const updatedBook = await service.get(book.uuid);
      expect(updatedBook.title).toEqual('updated title');
    });

    it('removes a book by uuid', async () => {
      const opts = { title: 'test title' };
      const book = await service.create(opts);

      await service.remove(book.uuid);

      try {
        await service.get(book.uuid);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFound);
      }
    });
  });

  it('passes a trivial test', () => {
    expect(true).toBe(true);
  });
});
