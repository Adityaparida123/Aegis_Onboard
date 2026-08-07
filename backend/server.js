const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { port } = require('./src/config/env');

async function startServer() {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
