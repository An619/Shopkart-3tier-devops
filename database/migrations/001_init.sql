DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Schema not applied. Run schema.sql first.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS _migrations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO _migrations (name) VALUES ('001_init')
ON CONFLICT (name) DO NOTHING;
