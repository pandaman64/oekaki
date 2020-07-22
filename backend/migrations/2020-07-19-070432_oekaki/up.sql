create table rooms (
    id bigserial primary key
);

create table paths (
    id bigserial primary key,
    xs float[] not null,
    ys float[] not null
);

create table draws (
    id bigserial primary key,
    room_id bigserial not null references rooms(id),
    path_id bigserial not null references paths(id)
);

create table operations (
    id bigserial primary key,
    room_id bigint not null references rooms(id),
    user_id uuid not null,
    ts bigint not null,
    parent_user_id uuid not null,
    parent_ts bigint not null,
    opcode text not null,
    payload jsonb not null,
    unique (user_id, ts)
);
