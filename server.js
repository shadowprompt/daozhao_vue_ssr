const fs = require('fs');
const path = require('path');
const express = require('express');
const LRU = require('lru-cache');

const manifestRouter = require('./manifestRouter');
const swrRouter = require('./swrRouter');
// const oauthRouter = require('./oidc-provider/oauthRouter');
const urlRouter = require('./urlRouter');

const { createBundleRenderer } = require('vue-server-renderer');
const devServer = require('./build/setup-dev-server');
const resolve = (file) => path.resolve(__dirname, file);

const config = require('./config');

const isProd = process.env.NODE_ENV === 'production';
const app = express();

const microCache = LRU({
  max: 100,
  maxAge: 1000, // 重要提示：条目在 1 秒后过期。
});
const isCacheAble = (req) => {
  // 实现逻辑为，检查请求是否是用户特定(user-specific)。
  // 只有非用户特定(non-user-specific)页面才会缓存
  return true;
};

const serve = (path, cache) =>
  express.static(resolve(path), {
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0,
  });
const port = process.env.PORT || 8899;

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, './views'));
app.use('/_manifest', manifestRouter);
app.use('/_service-worker.js', swrRouter);
app.use('/hms-messaging-sw.js', swrRouter);
app.use('/_url', urlRouter);
// app.use('/_oauth', oauthRouter('/_oauth', port));
app.use('/_dist', serve('./_dist', true));
app.use('/', serve('./static', true));

function createRenderer(bundle, options) {
  return createBundleRenderer(
    bundle,
    Object.assign(options, {
      basedir: resolve('./_dist'),
      runInNewContext: false,
    }),
  );
}

function render(req, res) {
  console.log(' render request.url -> ', req.url);
  const cacheAble = isCacheAble(req);
  if (cacheAble) {
    const hit = microCache.get(req.url);
    if (hit) {
      console.log('Response from cache');
      return res.end(hit);
    }
  }

  const startTime = Date.now();
  res.setHeader('Content-Type', 'text/html');

  const errorTemplatePath = resolve('./error.template.html');
  const errorTemplate = fs.readFileSync(errorTemplatePath, 'utf-8');

  const handleError = (err) => {
    if (err.url) {
      res.redirect(err.url);
    } else if (err.code === 404) {
      // res.status(404).send('404 | Page Not Found');
      res.status(200).send(errorTemplate);
    } else {
      // res.status(500).send('500 | Internal Server Error~');
      res.status(200).send(errorTemplate);
      console.log(err);
    }
  };

  const context = {
    ...config.static,
    url: req.url,
  };
  renderer.renderToString(context, (err, html) => {
    if (err) {
      return handleError(err);
    }
    res.send(html);
    if (cacheAble) {
      microCache.set(req.url, html);
    }
    if (!isProd) {
      console.log(`whole request: ${Date.now() - startTime}ms`);
    }
  });
}

let renderer;
let readyPromise;
const templatePath = resolve('./index.template.html');

if (isProd) {
  const template = fs.readFileSync(templatePath, 'utf-8');
  const bundle = require('./_dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./_dist/vue-ssr-client-manifest.json'); // 将js文件注入到页面中
  renderer = createRenderer(bundle, {
    template,
    clientManifest,
  });
} else {
  readyPromise = devServer(app, templatePath, (bundle, options) => {
    renderer = createRenderer(bundle, options);
  });
}

app.get(
  '*',
  isProd
    ? render
    : (req, res) => {
        readyPromise.then(() => render(req, res));
      },
);

app.listen(port, () => {
  console.log(`server started at localhost:${port}`);
});
