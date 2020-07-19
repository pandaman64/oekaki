table! {
    draws (id) {
        id -> Int4,
        room_id -> Int4,
        path_id -> Int4,
    }
}

table! {
    paths (id) {
        id -> Int4,
        xs -> Array<Float8>,
        ys -> Array<Float8>,
    }
}

table! {
    rooms (id) {
        id -> Int4,
    }
}

joinable!(draws -> paths (path_id));
joinable!(draws -> rooms (room_id));

allow_tables_to_appear_in_same_query!(draws, paths, rooms,);
