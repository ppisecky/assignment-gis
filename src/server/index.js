const port = process.env.API_PORT || 5000;

const cors = require('kcors');
const Koa = require('koa');
const router = require('./routes');
const middleware = require('./middleware');

const app = new Koa();

app.use(cors());
app.use(middleware.logger());
app.use(middleware.responseTime());
app.use(middleware.cleanArraySymbols());
app.use(router.routes());

app.listen(port);

console.log(`Server listening on ${port}.`);