create table rooms (
    id serial primary key
);

create table paths (
    id serial primary key,
    xs float[] not null,
    ys float[] not null
);

create table draws (
    id serial primary key,
    room_id serial not null references rooms(id),
    path_id serial not null references paths(id)
);

-- seed room
insert into rooms default values;