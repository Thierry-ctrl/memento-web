import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(62534602)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS memento_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const folder = new URL("./migrations/", import.meta.url);
  for (const name of (await readdir(folder))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const contents = await readFile(new URL(name, folder), "utf8");
    const hash = createHash("sha256").update(contents).digest("hex");
    const { rows } = await client.query(
      "SELECT checksum FROM memento_migrations WHERE name=$1",
      [name],
    );
    if (rows.length) {
      if (rows[0].checksum !== hash)
        throw new Error(
          `Applied migration ${name} changed. Restore it and create a new migration.`,
        );
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(contents);
      await client.query(
        "INSERT INTO memento_migrations(name,checksum) VALUES($1,$2)",
        [name, hash],
      );
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(62534602)");
  await client.end();
}
