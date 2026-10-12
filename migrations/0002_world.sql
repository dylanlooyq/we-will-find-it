-- Everything members create (profiles, listings, bounties, claims, conversations, notifications, …),
-- one JSON document per row. The API (worker/world.ts) reads and writes it; see there for the shapes.
CREATE TABLE doc (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (kind, id)
) WITHOUT ROWID;

-- 'rev' counts committed changes. Every write checks it hasn't moved since the data was read.
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
INSERT INTO meta (key, value) VALUES ('rev', 0);

-- The actions already carried out, by the one-off code each is sent with — so a browser that resends
-- one (it never heard back) doesn't do it twice. Rows older than a day are cleared as new ones arrive.
CREATE TABLE applied (
  nonce TEXT PRIMARY KEY,
  at INTEGER NOT NULL
) WITHOUT ROWID;

-- Never holds rows. A write inserts NULL here when 'rev' has moved, which fails the NOT NULL
-- constraint and rolls the whole batch back.
CREATE TABLE guard (
  ok INTEGER NOT NULL
);
