CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT,

    version INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);

CREATE TABLE IF NOT EXISTS collectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT,

    version INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collectors_phone ON collectors(phone);

CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,

    farmer_id TEXT NOT NULL,
    collector_id TEXT NOT NULL,

    crop_type TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    price_per_kg REAL NOT NULL,

    version INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (farmer_id) REFERENCES farmers(id),
    FOREIGN KEY (collector_id) REFERENCES collectors(id)
);

CREATE INDEX IF NOT EXISTS idx_collections_farmer_id ON collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collections_collector_id ON collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);