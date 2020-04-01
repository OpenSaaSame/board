const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use(
    '/v1',
    createProxyMiddleware({
      target: 'http://localhost:7575/',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};
