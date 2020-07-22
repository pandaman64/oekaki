table! {
    draws (id) {
        id -> Int8,
        room_id -> Int8,
        path_id -> Int8,
    }
}

table! {
    operations (id) {
        id -> Int8,
        room_id -> Int8,
        user_id -> Uuid,
        ts -> Int8,
        parent_user_id -> Uuid,
        parent_ts -> Int8,
        opcode -> Text,
        payload -> Jsonb,
    }
}

table! {
    paths (id) {
        id -> Int8,
        xs -> Array<Float8>,
        ys -> Array<Float8>,
    }
}

table! {
    rooms (id) {
        id -> Int8,
    }
}

joinable!(draws -> paths (path_id));
joinable!(draws -> rooms (room_id));
joinable!(operations -> rooms (room_id));

allow_tables_to_appear_in_same_query!(draws, operations, paths, rooms,);
