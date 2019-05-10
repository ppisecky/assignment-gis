const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        const res = await pool.query(text, params);

        const duration = Date.now() - start;
        console.log('Query duration', duration);

        return res;
    }
};