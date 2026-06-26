import pg from 'pg';

const { Pool } = pg;

// pool keeps multiple connections open and distributes queries among them
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(10) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
        )
    `);
}