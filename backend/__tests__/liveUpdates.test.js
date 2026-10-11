/**
 * Live update stream tests
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');

describe('Live updates', () => {
  let server;
  let baseUrl;
  let token;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    await User.deleteMany({});
    await Employee.deleteMany({});
    await User.create({ name: 'Admin User', email: 'admin.live.test@example.com', password: 'AdminPass123!', role: 'admin' });

    await new Promise(resolve => { server = app.listen(0, resolve); });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.live.test@example.com', password: 'AdminPass123!' }),
    });
    token = (await login.json()).token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  });

  it('rejects unauthenticated stream requests', async () => {
    const response = await fetch(`${baseUrl}/api/events`);
    expect(response.status).toBe(401);
  });

  it('notifies connected clients when an employee is created', async () => {
    const controller = new AbortController();
    const stream = await fetch(`${baseUrl}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    expect(stream.status).toBe(200);
    expect(stream.headers.get('content-type')).toContain('text/event-stream');

    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    let received = '';
    const waitForResource = (async () => {
      while (!received.includes('"resource":"employees"')) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value);
      }
      return received;
    })();

    const created = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Live Test Employee',
        email: 'live.test.employee@example.com',
        position: 'Cashier',
        department: 'Dining',
        basicSalary: 20000,
        dateHired: '2024-01-15',
      }),
    });
    expect(created.status).toBe(201);

    const message = await waitForResource;
    controller.abort();
    expect(message).toContain('"resource":"employees"');
  });
});
