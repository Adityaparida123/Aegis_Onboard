const app = require('../src/app');

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`E2E server listening on port ${port}`);
});
