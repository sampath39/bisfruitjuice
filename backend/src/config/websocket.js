import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });
  console.log('🔌 WebSocket Server initialized.');

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Send a welcome check
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Bismilla Fruit Juice WebSocket Server' }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('🔌 WebSocket client error:', err);
      clients.delete(ws);
    });
  });
};

export const broadcast = (data) => {
  if (!wss) return;
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error sending message to client:', err);
      }
    }
  });
};
