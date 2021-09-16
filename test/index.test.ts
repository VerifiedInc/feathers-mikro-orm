import { Application, Paginated } from '@feathersjs/feathers';
import { setupApp } from './app';
import createService, { Service } from '../src';
import { NotFound } from '@feathersjs/errors';
import { Book } from './entities/Book';

describe('feathers-mikro-orm', () => {
  let app: Application;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('defines a service', () => {
    expect(app.service('book')).toBeDefined();
  });

  describe('the book service', () => {
    let service: Service;

    beforeAll(() => {
      service = app.service('book');
    });

    afterEach(async () => {
      const orm = app.get('orm');
      const connection = orm.em.getConnection();
      await connection.execute('DELETE FROM book;');
    });

    describe('create', () => {
      it('creates a book', async () => {
        const options = { title: 'test' };
        const book = await service.create(options);
        expect(book).toBeDefined();
        expect(book.uuid).toBeDefined();
        expect(book.title).toEqual(options.title);
      });

      it('saves the created book', async () => {
        const options = { title: 'test' };
        const book = await service.create(options);
        const savedBook = await service.get(book.uuid);
        expect(savedBook).toEqual(book);
      });
    });

    describe('get', () => {
      it('gets a saved book by id', async () => {
        const options = { title: 'test' };
        const initial = await service.create(options);
        const saved = await service.get(initial.uuid);
        expect(saved).toEqual(initial);
      });
    });

    describe('find', () => {
      it('returns all entities if there are no params', async () => {
        const options = { title: 'test' };
        const options2 = { title: 'another' };
        const book1 = await service.create(options);
        const book2 = await service.create(options2);
        const saved = await service.find() as Book[];

        expect(saved.length).toEqual(2);
        expect(saved).toContainEqual(book1);
        expect(saved).toContainEqual(book2);
      });

      it('finds by query params', async () => {
        const options = { title: 'test' };
        const options2 = { title: 'another' };
        const book1 = await service.create(options);
        const book2 = await service.create(options2);
        const saved = await service.find({ query: { title: 'test' } }) as Book[];

        expect(saved.length).toEqual(1);
        expect(saved).toContainEqual(book1);
        expect(saved).not.toContainEqual(book2);
      });

      it('honors feathers options passed as query params', async () => {
        const options = { title: 'test' };
        const options2 = { title: 'another' };
        const book1 = await service.create(options);
        const book2 = await service.create(options2);
        // sort/order results using feathers $sort query param
        const saved = await service.find({ query: { $sort: { title: 1 } } }) as Book[];
        console.log('saved', saved);

        expect(saved.length).toEqual(2);
        expect(saved[0]).toEqual(book2);
        expect(saved[1]).toEqual(book1);
      });

      it('honors mikro-orm options passed as params.options', async () => {
        const options = { title: 'test' };
        const options2 = { title: 'another' };
        const book1 = await service.create(options);
        const book2 = await service.create(options2);
        // sort/order results using mikro-orm orderBy option in params
        const saved = await service.find({ options: { orderBy: { title: 'ASC' } } }) as Book[];
        console.log('saved', saved);

        expect(saved.length).toEqual(2);
        expect(saved[0]).toEqual(book2);
        expect(saved[1]).toEqual(book1);
      });

      describe('pagination', () => {
        it('returns a Paginated object if $limit query param is set', async () => {
          const options = { title: 'test' };
          const options2 = { title: 'test' };
          const options3 = { title: 'test' };
          const book1 = await service.create(options);
          const book2 = await service.create(options2);
          await service.create(options3);
          const result = await service.find({ query: { title: 'test', $limit: 2 } }) as Paginated<Book>;

          expect(result.total).toEqual(3);
          expect(result.limit).toEqual(2);
          expect(result.skip).toEqual(0);
          expect(result.data.length).toEqual(2);
          expect(result.data).toContainEqual(book1);
          expect(result.data).toContainEqual(book2);
        });

        it('offsets results by $skip query param', async () => {
          const options = { title: 'test' };
          const options2 = { title: 'test' };
          const options3 = { title: 'test' };
          const book1 = await service.create(options);
          const book2 = await service.create(options2);
          const book3 = await service.create(options3);
          const result = await service.find({ query: { title: 'test', $limit: 2, $skip: 1 } }) as Paginated<Book>;

          expect(result.total).toEqual(3);
          expect(result.limit).toEqual(2);
          expect(result.skip).toEqual(1);
          expect(result.data.length).toEqual(2);
          expect(result.data).toContainEqual(book2);
          expect(result.data).toContainEqual(book3);
          expect(result.data).not.toContainEqual(book1);
        });

        it('uses default limit set at service initialization if no $limit query param is set', async () => {
          const options = { title: 'test' };
          const options2 = { title: 'test' };
          const options3 = { title: 'test' };

          const paginatedService = createService({
            orm: app.get('orm'),
            Entity: Book,
            paginate: { default: 1 }
          });

          const book = await paginatedService.create(options);
          await paginatedService.create(options2);
          await paginatedService.create(options3);
          const result = await paginatedService.find({ query: { title: 'test' } }) as Paginated<Book>;

          expect(result.total).toEqual(3);
          expect(result.limit).toEqual(1);
          expect(result.skip).toEqual(0);
          expect(result.data.length).toEqual(1);
          expect(result.data).toContainEqual(book);
        });

        it('honors max limit set at service initialization', async () => {
          const options = { title: 'test' };
          const options2 = { title: 'test' };
          const options3 = { title: 'test' };

          const paginatedService = createService({
            orm: app.get('orm'),
            Entity: Book,
            paginate: { default: 1, max: 2 }
          });

          const book1 = await paginatedService.create(options);
          const book2 = await paginatedService.create(options2);
          await paginatedService.create(options3);

          // test with a limit set in params
          const resultWithLimit = await paginatedService.find({ query: { title: 'test', $limit: 3 } }) as Paginated<Book>;

          expect(resultWithLimit.total).toEqual(3);
          expect(resultWithLimit.limit).toEqual(2);
          expect(resultWithLimit.skip).toEqual(0);
          expect(resultWithLimit.data.length).toEqual(2);
          expect(resultWithLimit.data).toContainEqual(book1);
          expect(resultWithLimit.data).toContainEqual(book2);

          // test without a limit set in params
          const resultWithoutLimit = await paginatedService.find({ query: { title: 'test' } }) as Paginated<Book>;

          expect(resultWithoutLimit.total).toEqual(3);
          expect(resultWithoutLimit.limit).toEqual(2);
          expect(resultWithoutLimit.skip).toEqual(0);
          expect(resultWithoutLimit.data.length).toEqual(2);
          expect(resultWithoutLimit.data).toContainEqual(book1);
          expect(resultWithoutLimit.data).toContainEqual(book2);
        });
      });
    });

    describe('patch', () => {
      it('updates a saved book by id', async () => {
        const options = { title: 'test' };
        const initial = await service.create(options);
        const patched = await service.patch(initial.uuid, { title: 'updated' });
        expect(patched.title).toEqual('updated');

        const saved = await service.get(initial.uuid);
        expect(saved).toEqual(patched);
      });
    });

    describe('remove', () => {
      it('deletes a saved book by id', async () => {
        const options = { title: 'test' };
        const initial = await service.create(options);

        await service.remove(initial.uuid);

        try {
          await service.get(initial.uuid);
          fail();
        } catch (e) {
          expect(e).toEqual(new NotFound('Book not found.'));
        }
      });

      it('ignores params when deleting by id', async () => {
        const options = { title: 'test' };
        const params = { query: {} };
        const savedBook = await service.create(options);

        await service.remove(savedBook.uuid, params);

        try {
          await service.get(savedBook.uuid);
          fail();
        } catch (e) {
          expect(e).toEqual(new NotFound('Book not found.'));
        }
      });

      it('returns the deleted book', async () => {
        const options = { title: 'test' };
        const initial = await service.create(options);

        const removed = await service.remove(initial.uuid);
        expect(removed).toEqual(initial);
      });

      it('deletes many books by params', async () => {
        const options1 = { title: 'test' };
        const options2 = { title: 'test' };
        await service.create(options1);
        await service.create(options2);

        const response = await service.remove(null, { where: { title: 'test' } });
        expect(response).toEqual({ success: true });

        // check that all of the books have been removed
        const found = await service.find() as Book[];
        expect(found.length).toEqual(0);
      });
    });
  });
});
