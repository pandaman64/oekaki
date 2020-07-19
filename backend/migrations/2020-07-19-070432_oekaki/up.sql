create schema api;

create role web_anon nologin;
grant usage on schema api to web_anon;

create role authenticator noinherit login password 'pandamansecretpassword';
grant web_anon to authenticator;

create table api.rooms (
    id serial primary key
);

create table api.paths (
    id serial primary key,
    xs integer[] not null,
    ys integer[] not null
);

create table api.draws (
    id serial primary key,
    room_id serial not null references api.rooms(id),
    path_id serial not null references api.paths(id)
);

grant select, insert, update on api.rooms to web_anon;
grant select, insert, update on api.paths to web_anon;
grant select, insert, update on api.draws to web_anon;

-- seed room
insert into api.rooms default values;