-- Fresh database or original Replit schema. Preserve all historical amounts.
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('pending','contacted','confirmed','declined','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE customer_type AS ENUM ('individual','organization'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('not_due','due','paid','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS booking_requests (
  id serial PRIMARY KEY, reference text NOT NULL UNIQUE,
  status booking_status NOT NULL DEFAULT 'pending', customer_type customer_type NOT NULL DEFAULT 'individual',
  organization_name text, full_name text NOT NULL, phone text NOT NULL, email text,
  preferred_contact_method text NOT NULL, event_type text NOT NULL, event_date date NOT NULL,
  start_time time NOT NULL, end_time time, duration_hours integer,
  venue text NOT NULL, location text NOT NULL, guest_count integer NOT NULL,
  print_format text NOT NULL, backdrop_preference text NOT NULL, add_ons jsonb NOT NULL DEFAULT '[]',
  branded_requirements text, notes text, consent boolean NOT NULL,
  early_request boolean NOT NULL DEFAULT false, potential_conflict boolean NOT NULL DEFAULT false,
  hourly_rate_rwf integer, total_amount_rwf integer, deposit_percentage integer, deposit_amount_rwf integer,
  payment_status payment_status NOT NULL DEFAULT 'not_due', payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_notes (
  id serial PRIMARY KEY, booking_id integer NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blocked_availability (
  id serial PRIMARY KEY, date date NOT NULL, start_time time, end_time time,
  reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE booking_requests
  ALTER COLUMN hourly_rate_rwf DROP NOT NULL, ALTER COLUMN hourly_rate_rwf DROP DEFAULT,
  ALTER COLUMN total_amount_rwf DROP NOT NULL, ALTER COLUMN total_amount_rwf DROP DEFAULT,
  ALTER COLUMN deposit_percentage DROP NOT NULL, ALTER COLUMN deposit_percentage DROP DEFAULT,
  ALTER COLUMN deposit_amount_rwf DROP NOT NULL, ALTER COLUMN deposit_amount_rwf DROP DEFAULT,
  ALTER COLUMN payment_method DROP NOT NULL, ALTER COLUMN payment_method DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS package_id text,
  ADD COLUMN IF NOT EXISTS package_name text,
  ADD COLUMN IF NOT EXISTS pricing_version text,
  ADD COLUMN IF NOT EXISTS included_hours integer,
  ADD COLUMN IF NOT EXISTS base_price_rwf integer,
  ADD COLUMN IF NOT EXISTS quote_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;
UPDATE booking_requests SET starts_at = (event_date + start_time) AT TIME ZONE 'Africa/Kigali' WHERE starts_at IS NULL;
-- Unknown legacy duration occupies the remainder of the day until reviewed.
UPDATE booking_requests SET ends_at = CASE
  WHEN duration_hours > 0 THEN starts_at + duration_hours * INTERVAL '1 hour'
  WHEN end_time IS NOT NULL THEN
    (event_date + end_time + CASE WHEN end_time <= start_time THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END) AT TIME ZONE 'Africa/Kigali'
  ELSE (event_date + INTERVAL '1 day') AT TIME ZONE 'Africa/Kigali'
END WHERE ends_at IS NULL;
ALTER TABLE booking_requests ALTER COLUMN starts_at SET NOT NULL, ALTER COLUMN ends_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS booking_schedule_idx ON booking_requests(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS admin_notes_booking_idx ON admin_notes(booking_id);
CREATE TABLE IF NOT EXISTS notification_outbox (
  id serial PRIMARY KEY, booking_id integer NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  recipient text NOT NULL, subject text NOT NULL, body text NOT NULL, attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_pending_idx ON notification_outbox(next_attempt_at) WHERE sent_at IS NULL;
