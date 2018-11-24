const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        const res = await pool.query(text, params);

        const duration = Date.now() - start;
        let extra = { text, duration, res};
        console.log('executed query', extra);

        return res;
    }
};