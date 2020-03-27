const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use(
    '/v1',
    createProxyMiddleware({
      // target: 'https://a05bafae-8ea2-4847-9d1a-a11573732e04.mock.pstmn.io/',
      target: 'http://localhost:7575/',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};
