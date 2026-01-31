// Cypress configuration and Node event handlers (tasks for DB, reporters)
const { defineConfig } = require('cypress');
const pg = require('pg');
const mysql = require('mysql2/promise');
const fs = require('fs');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      try {
        require('@shelex/cypress-allure-plugin/writer')(on, config);
      } catch (err) {
        // allure plugin optional
      }

      on('task', {
        async queryDatabase({ query, values }) {
          const dbUrl = process.env.DB_URL || config.env.DB_URL;
          const client = process.env.DB_CLIENT || config.env.DB_CLIENT || 'pg';
          if (!dbUrl) throw new Error('DB_URL not set in env');

          if (client === 'pg') {
            const pool = new pg.Pool({ connectionString: dbUrl });
            try {
              const res = await pool.query(query, values || []);
              await pool.end();
              return res.rows;
            } catch (err) {
              await pool.end();
              throw err;
            }
          } else if (client === 'mysql') {
            const conn = await mysql.createConnection(dbUrl);
            try {
              const [rows] = await conn.execute(query, values || []);
              await conn.end();
              return rows;
            } catch (err) {
              await conn.end();
              throw err;
            }
          }

          throw new Error(`Unsupported DB client: ${client}`);
        },

        async seedDatabase({ sqlPath }) {
          const dbUrl = process.env.DB_URL || config.env.DB_URL;
          const client = process.env.DB_CLIENT || config.env.DB_CLIENT || 'pg';
          if (!dbUrl) throw new Error('DB_URL not set in env');
          const sql = fs.readFileSync(sqlPath, 'utf8');

          if (client === 'pg') {
            const pool = new pg.Pool({ connectionString: dbUrl });
            try {
              await pool.query(sql);
              await pool.end();
              return true;
            } catch (err) {
              await pool.end();
              throw err;
            }
          } else if (client === 'mysql') {
            const conn = await mysql.createConnection(dbUrl);
            try {
              await conn.query(sql);
              await conn.end();
              return true;
            } catch (err) {
              await conn.end();
              throw err;
            }
          }
          throw new Error(`Unsupported DB client: ${client}`);
        },

        async clearDatabase({ sqlPath }) {
          return await on('task').seedDatabase({ sqlPath });
        }
      });

      // return the updated config
      return config;
    }
  },

  reporter: 'cypress-multi-reporters',
  reporterEnabled: 'mochawesome, spec',
  reporterOptions: {
    mochawesomeReporterOptions: {
      reportDir: 'reports/mochawesome',
      overwrite: false,
      html: true,
      json: true
    }
  }
});
