const fs = require('fs')
const path = require('path')
const { pool } = require('../config/db')

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function migrate() {
  const client = await pool.connect()
  const migrationsDir = path.resolve(__dirname, '../../migrations')

  try {
    await ensureMigrationsTable(client)

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const alreadyRan = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      )

      if (alreadyRan.rowCount > 0) {
        console.log(`Migration ja aplicada: ${file}`)
        continue
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      )
      await client.query('COMMIT')
      console.log(`Migration aplicada: ${file}`)
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
