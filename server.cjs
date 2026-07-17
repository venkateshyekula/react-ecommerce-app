const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json'); // Make sure this points to your JSON file
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Use default router
server.use(router);

let PORT = 4000;

const startServer = (portToAttempt) => {
  const app = server.listen(portToAttempt, () => {
    console.log(`[Mock Server] Success! JSON Server is running on port ${portToAttempt}`);
  });

  // Listen for errors specifically on the server instance
  app.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`[Mock Server] Port ${portToAttempt} is busy. Retrying on port ${portToAttempt + 1}...`);
      
      // Increment the port number and try again automatically
      startServer(portToAttempt + 1);
    } else {
      console.error('Server encountered an error:', error);
      process.exit(1);
    }
  });
};

// Start the server
startServer(PORT);