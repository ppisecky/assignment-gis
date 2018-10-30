const port = process.env.API_PORT || 5000;

const Koa = require('koa');
const app = new Koa();


app.use(async ctx => {
    ctx.body = 'Hello World';
});

app.listen(port);