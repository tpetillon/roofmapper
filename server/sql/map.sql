CREATE TABLE france_grid (
	id serial PRIMARY KEY,
	name varchar(4),
	geom geometry(POLYGON, 4326)
);


-- mainland
INSERT INTO france_grid(name, geom)
    SELECT concat(chr(65+(hor.n+5*4+1)/26), chr(65+((hor.n+5*4+1)%26)), to_char(ver.n-(41*4+1), 'fm00')) AS id
    , ST_Translate(ST_MakeEnvelope(0, 0, 1.0/4, 1.0/4, 4326),
    hor.n::float/4, ver.n::float/4) As geom
    FROM
    generate_series(-5*4-1,8*4) as hor(n), generate_series(42*4+1,51*4) as ver(n);

-- Corsica
INSERT INTO france_grid(name, geom)
    SELECT concat(chr(65+(hor.n+5*4+1)/26), chr(65+((hor.n+5*4+1)%26)), to_char(ver.n-(41*4+1), 'fm00')) AS id
    , ST_Translate(ST_MakeEnvelope(0, 0, 1.0/4, 1.0/4, 4326),
    hor.n::float/4, ver.n::float/4) As geom
    FROM
    generate_series(8*4+1,10*4-2) as hor(n), generate_series(41*4+1,43*4) as ver(n);
