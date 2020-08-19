import { Application } from '@feathersjs/feathers';
import { NotFound } from '@feathersjs/errors';
import { v4 } from 'uuid';

import { setupApp } from './setupApp';
import { Book } from './entities';
import { MikroOrmService } from '../';

describe('feathers-mikro-orm', () => {
  let app: Application;
  beforeAll(async () => {
    app = await setupApp();
  });

  it('defines a service', () => {
    expect(app.service('book')).toBeDefined();
  });

  describe('the book service', () => {
    let service: MikroOrmService<Book>;

    beforeAll(() => {
      service = app.service('book');
    });

    beforeEach(async () => {
      const mikro = app.get('mikro');
      const connection = mikro.em.getConnection();
      await connection.execute('DELETE FROM "book";');
    });

    describe('create', () => {
      it('creates a book', async () => {
        const bookOpts = { title: 'test title' };
        const book = await service.create(bookOpts);
        expect(book).toBeDefined();
        expect(book.uuid).toBeDefined();
        expect(book.title).toEqual(bookOpts.title);
      });

      it('saves the created book in the database', async () => {
        const bookOpts = { title: 'test title' };
        const book = await service.create(bookOpts);
        const savedBook = await service.get(book.uuid);
        expect(savedBook).toBeDefined();
        expect(savedBook).toEqual(book);
      });
    });

    describe('get', () => {
      const bookOpts = { title: 'test title' };
      let uuid: string;
      beforeEach(async () => {
        const createdBook = await service.create(bookOpts);
        uuid = createdBook.uuid;
      });

      it('gets a created book by id', async () => {
        const book = await service.get(uuid);
        expect(book).toBeDefined();
      });

      it('gets books by where param if id passed is null', async () => {
        const params = { where: { title: 'test title' } };
        const book = service.get(null, params);
        expect(book).toBeDefined();
      });

      it('gets books by where query param if id passed is null', async () => {
        const params = { query: { where: { title: 'test title' } } };
        const book = service.get(null, params);
        expect(book).toBeDefined();
      });

      it('throws a NotFound error if no book is found', async () => {
        try {
          await service.get(v4());
          fail('expected to throw.');
        } catch (e) {
          expect(e).toBeInstanceOf(NotFound);
        }
      });
    });

    describe('find', () => {
      const opts1 = { title: 'test title 1' };
      const opts2 = { title: 'test title 2' };

      beforeEach(async () => {
        await service.create(opts1);
        await service.create(opts2);
      });

      it('finds all created books if no params are passed', async () => {
        const books = await service.find();
        expect(books.length).toEqual(2);
      });

      it('finds books by where param', async () => {
        const params = { where: { title: opts1.title } };
        const books = await service.find(params);
        expect(books.length).toEqual(1);
        expect(books[0].title).toEqual(params.where.title);
      });
    });

    describe('patch', () => {
      const opts = { title: 'test title' };
      let book: Book;

      beforeEach(async () => {
        book = await service.create(opts) as Book;
      });

      it('patches a book by id', async () => {
        await service.patch(book.uuid, { title: 'updated title' });
        const updatedBook = await service.get(book.uuid);
        expect(updatedBook.title).toEqual('updated title');
      });

      it('throws a NotFound error if the book to patch is not found', async () => {
        try {
          await service.patch(v4(), { title: 'updated title' });
          fail('expected to throw.');
        } catch (e) {
          expect(e).toBeInstanceOf(NotFound);
        }
      });
    });

    describe('remove', () => {
      const opts = { title: 'test title' };
      let book: Book;

      beforeEach(async () => {
        book = await service.create(opts) as Book;
      });

      it('removes a book by uuid', async () => {
        await service.remove(book.uuid);

        try {
          await service.get(book.uuid);
        } catch (e) {
          expect(e).toBeInstanceOf(NotFound);
        }
      });

      it('throws a NotFound if the book to delete is not found', async () => {
        try {
          await service.remove(v4());
          fail('expected to throw.');
        } catch (e) {
          expect(e).toBeInstanceOf(NotFound);
        }
      });
    });
  });
});
