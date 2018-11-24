/**
 * Log response time once the request travels back upstream
 *
 * @returns {logger}
 */
function logger() {
    return async function logger (ctx, next) {
        await next();
        const rt = ctx.response.get('X-Response-Time');
        console.log(`${ctx.method} ${ctx.path} -- ${rt}`);
    }
}

/**
 * Add response duration to the context object
 *
 * @returns {responseTime}
 */
function responseTime() {
    return async function responseTime (ctx, next) {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        ctx.set('X-Response-Time', `${ms}ms`);
    }
}

/**
 * Clean the query by removing `[]` from variable names
 *
 * @returns {cleanArraySymbols}
 */
function cleanArraySymbols() {
    return async function cleanArraySymbols(ctx, next) {
        let keys = Object.keys(ctx.query), i = 0, key, value, newKey;

        for(i; i < keys.length; i++) {
            key = keys[i];
            value = ctx.query[key];
            newKey = key.replace("[]", "");
            if (key !== newKey) {
                ctx.query[newKey] = value;
                delete ctx.query[key];
            }
        }

        await next();
    }
}

module.exports = {
    logger,
    responseTime,
    cleanArraySymbols
};