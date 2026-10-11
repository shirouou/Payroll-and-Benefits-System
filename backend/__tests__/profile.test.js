/**
 * Profile Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

const pngBytes = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);

describe('Profile Routes', () => {
  let token;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await User.create({
      name: 'Profile Tester',
      email: 'profile.tester@example.com',
      password: 'TesterPass123!',
      role: 'employee',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile.tester@example.com', password: 'TesterPass123!' });
    token = login.body.token;
  });

  it('requires authentication', async () => {
    const response = await request(app).put('/api/profile').send({ name: 'Someone' });
    expect(response.status).toBe(401);
  });

  it('updates the display name', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Maria   Santos ' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Maria Santos');

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.name).toBe('Maria Santos');
  });

  it('rejects a name that is too short', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' });

    expect(response.status).toBe(400);
  });

  it('stores, returns and removes a profile photo', async () => {
    const upload = await request(app)
      .put('/api/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', pngBytes, { filename: 'me.png', contentType: 'image/png' });

    expect(upload.status).toBe(200);
    expect(upload.body.data.avatarUpdatedAt).toBeTruthy();

    const photo = await request(app).get('/api/profile/avatar').set('Authorization', `Bearer ${token}`);
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toContain('image/png');
    expect(photo.body).toEqual(pngBytes);

    const removed = await request(app).delete('/api/profile/avatar').set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.avatarUpdatedAt).toBeNull();

    const missing = await request(app).get('/api/profile/avatar').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('rejects a file that is not an image even if labelled as one', async () => {
    const response = await request(app)
      .put('/api/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('<script>alert(1)</script>'), { filename: 'x.png', contentType: 'image/png' });

    expect(response.status).toBe(400);
  });

  it('rejects an oversized photo', async () => {
    const response = await request(app)
      .put('/api/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.concat([pngBytes, Buffer.alloc(2 * 1024 * 1024)]), { filename: 'big.png', contentType: 'image/png' });

    expect(response.status).toBe(413);
  });
});
