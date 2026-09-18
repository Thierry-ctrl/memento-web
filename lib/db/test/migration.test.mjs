import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import pg from "pg";

test("upgrade preserves a legacy price, backfills overnight times and is repeatable", async () => {
  const url = new URL(process.env.TEST_DATABASE_URL || "postgresql://memento_test:local-test-only@127.0.0.1:55439/memento_test");
  if (url.hostname !== "127.0.0.1" || url.port !== "55439" || !url.pathname.endsWith("_test")) throw new Error("Isolated local test database required");
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  const name = `memento_migration_${Date.now()}_test`;
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = "/" + name;
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const migration = await readFile(new URL("../migrations/001_booking_launch.sql", import.meta.url), "utf8");
    // Recreate the pre-launch table shape and old pricing defaults.
    await client.query(migration.split("ALTER TABLE booking_requests")[0]);
    await client.query("ALTER TABLE booking_requests ALTER COLUMN hourly_rate_rwf SET DEFAULT 150000, ALTER COLUMN hourly_rate_rwf SET NOT NULL, ALTER COLUMN total_amount_rwf SET DEFAULT 0, ALTER COLUMN total_amount_rwf SET NOT NULL, ALTER COLUMN deposit_percentage SET DEFAULT 30, ALTER COLUMN deposit_percentage SET NOT NULL, ALTER COLUMN deposit_amount_rwf SET DEFAULT 0, ALTER COLUMN deposit_amount_rwf SET NOT NULL, ALTER COLUMN payment_method SET DEFAULT 'mtn_momo', ALTER COLUMN payment_method SET NOT NULL");
    await client.query("INSERT INTO booking_requests(reference, full_name, phone, preferred_contact_method, event_type, event_date, start_time, duration_hours, venue, location, guest_count, print_format, backdrop_preference, consent, total_amount_rwf, deposit_amount_rwf) VALUES('LEGACY-TEST','Legacy Test','0788123456','phone','Birthday','2099-10-01','23:00',3,'Test','Kigali',10,'discuss','discuss',true,450000,135000)");
    for (let i = 0; i < 2; i++) {
      const result = spawnSync(process.execPath, [new URL("../migrate.mjs", import.meta.url).pathname], { env: { ...process.env, DATABASE_URL: url.toString() }, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
    const row = (await client.query("SELECT * FROM booking_requests")).rows[0];
    assert.equal(row.total_amount_rwf, 450000);
    assert.equal(row.deposit_percentage, 30);
    assert.equal(row.deposit_amount_rwf, 135000);
    assert.equal(row.package_id, null);
    assert.equal(row.starts_at.toISOString(), "2099-10-01T21:00:00.000Z");
    assert.equal(row.ends_at.toISOString(), "2099-10-02T00:00:00.000Z");
    assert.equal((await client.query("SELECT * FROM memento_migrations")).rowCount, 1);
  } finally {
    await client.end();
    // Delete only the disposable database this test created.
    await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
  }
});
