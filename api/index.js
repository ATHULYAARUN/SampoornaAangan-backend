const serverless = require('serverless-http');
const app = require('../server-app');

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
