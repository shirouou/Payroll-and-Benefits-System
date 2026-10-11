/**
 * Live updates: successful data changes are broadcast to connected clients over
 * Server-Sent Events. Events carry only the resource name, never record data, so
 * each client refetches its own role-scoped data.
 */

const clients = new Set();
const HEARTBEAT_MS = 25000;
const WATCHED_RESOURCES = new Set(['employees', 'payroll', 'claims', 'hmo', 'bonuses']);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const broadcast = (resource) => {
  const message = `data: ${JSON.stringify({ resource, at: new Date().toISOString() })}\n\n`;
  clients.forEach(client => client.write(message));
};

// Broadcast after any successful write to a watched resource.
const broadcastChanges = (req, res, next) => {
  if (MUTATING_METHODS.has(req.method)) {
    const resource = req.path.split('/')[1];
    if (WATCHED_RESOURCES.has(resource)) {
      res.on('finish', () => {
        if (res.statusCode < 400) broadcast(resource);
      });
    }
  }
  next();
};

const eventStream = (req, res) => {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n: connected\n\n');

  clients.add(res);
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), HEARTBEAT_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
};

module.exports = { broadcastChanges, eventStream };
