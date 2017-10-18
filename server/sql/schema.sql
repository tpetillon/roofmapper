-- Database init

DROP TABLE buildings;
DROP TYPE building_type;
DROP TABLE sessions;

CREATE TABLE sessions (
	id serial PRIMARY KEY NOT NULL,
	user_id integer NOT NULL,
	start_date timestamp DEFAULT now(),
	end_date timestamp NULL
);

CREATE TYPE building_type AS ENUM ('way', 'relation');
CREATE TYPE invalidity_reason AS ENUM ('outdated', 'multiple_materials', 'multiple_buildings', 'building_fraction', 'not_a_building');

CREATE TABLE buildings (
	id serial PRIMARY KEY NOT NULL,
	type building_type NOT NULL,
	osm_id integer NOT NULL,
	version integer NOT NULL,
	roof_material varchar(32) NULL,
	session_id integer NULL REFERENCES sessions,
	changeset_id integer NULL,
    invalidity invalidity_reason NULL,
	UNIQUE (type, osm_id)
);

CREATE INDEX buildings_type_osm_id_index ON buildings (type, osm_id);

SELECT AddGeometryColumn('buildings', 'location', 4326, 'POINT', 2);

-- If updating
ALTER TABLE buildings RENAME TO buildings_bak;
ALTER INDEX buildings_type_osm_id_index RENAME TO buildings_type_osm_id_index_bak;

INSERT INTO buildings (type, osm_id, version, roof_material, session_id, changeset_id, invalidity)
SELECT type, osm_id, version, roof_material, session_id, changeset_id, invalidity FROM buildings_bak
WHERE session_id IS NOT NULL;

DROP TABLE buildings_bak;

-- Insert CSV in database

CREATE TABLE temp (
	type building_type,
	id integer,
	version integer,
	lon numeric,
	lat numeric
);

COPY temp FROM 'path/to/file.csv' DELIMITERS ',' CSV HEADER;

-- Get pseudo_encrypt function:
-- https://wiki.postgresql.org/wiki/Pseudo_encrypt

CREATE SEQUENCE seq MAXVALUE 2147483647;

ALTER TABLE temp
ADD random_index integer DEFAULT (pseudo_encrypt(nextval('seq')::int)) NOT NULL;

INSERT INTO buildings (type, osm_id, version, location)
SELECT type, id, version, ST_SetSRID(ST_MakePoint(lon, lat), 4326)
FROM (SELECT * FROM temp ORDER BY random_index) AS temp -- Shuffle the table!
ON CONFLICT DO NOTHING;

DROP TABLE temp;