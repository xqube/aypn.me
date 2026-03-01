import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { initCache } from '../src/content/cache.js';

let app;

beforeAll(async () => {
    // Build the in-memory cache before importing the app
    await initCache(true); // silent = true
    app = (await import('../app.js')).default || require('../app.js');
});

describe('Route smoke tests', () => {
    it('GET / → 200 with <title>', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('<title>');
    });

    it('GET /blog → 200 with Posts', async () => {
        const res = await request(app).get('/blog');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Posts');
    });

    it('GET /blog/nonexistent-slug → 404', async () => {
        const res = await request(app).get('/blog/nonexistent-slug-xyz-12345');
        expect(res.status).toBe(404);
    });

    it('GET /sitemap.xml → 200 with XML', async () => {
        const res = await request(app).get('/sitemap.xml');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('xml');
        expect(res.text).toContain('<urlset');
    });

    it('GET /rss → 200 with Atom feed', async () => {
        const res = await request(app).get('/rss');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('atom+xml');
        expect(res.text).toContain('<feed');
    });
});
