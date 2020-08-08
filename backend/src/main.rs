#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde;

use diesel::pg::PgConnection;
use diesel::prelude::*;
use rocket::response::Debug;
use rocket_contrib::json::Json;
use std::collections::HashMap;
use uuid::Uuid;

mod draw;
mod operation;
mod path;
mod room;
mod schema;

use path::Path;

type Error = Box<dyn std::error::Error + 'static>;

fn database_connection() -> Result<PgConnection, Error> {
    let url = std::env::var("DATABASE_URL")?;
    PgConnection::establish(&url).map_err(Into::into)
}

#[get("/rooms/<room_id>/path")]
fn path(room_id: i64) -> Result<Json<Vec<Path>>, Debug<Error>> {
    let conn = database_connection()?;

    Ok(Json(
        schema::paths::table
            .inner_join(schema::draws::table)
            .filter(schema::draws::dsl::room_id.eq(room_id))
            .order(schema::paths::dsl::id.asc())
            .select((schema::paths::dsl::xs, schema::paths::dsl::ys))
            .load(&conn)
            .map_err(Error::from)?,
    ))
}

#[post("/rooms/<room_id>/new_path", data = "<data>")]
fn new_path(room_id: i64, data: Json<Path>) -> Result<(), Debug<Error>> {
    eprintln!("{:?}", data);
    if data.xs.len() != data.ys.len() {
        return Err(Debug("invalid data length".into()));
    }
    {
        let conn = database_connection()?;

        conn.transaction::<(), Error, _>(|| {
            let path_id: i64 = diesel::insert_into(schema::paths::table)
                .values(&path::NewPath {
                    xs: &data.xs,
                    ys: &data.ys,
                })
                .returning(schema::paths::dsl::id)
                .get_result(&conn)?;
            diesel::insert_into(schema::draws::table)
                .values(&draw::NewDraw { room_id, path_id })
                .execute(&conn)?;

            Ok(())
        })
        .map_err(Debug::from)?;
    }

    Ok(())
}

// Server UUID: 8aae574e-50b7-4978-86f5-a2ba7cf3b12e
const SERVER_USER_ID: &str = "8aae574e-50b7-4978-86f5-a2ba7cf3b12e";

fn preorder_traversal(
    operations: &[operation::Operation],
    edges: &[Vec<usize>],
    root_index: usize,
    ret: &mut Vec<operation::Operation>,
) {
    // first, visit the root
    ret.push(operations[root_index].clone());

    // sort children in descending order and visit them
    let mut tos = edges[root_index].clone();
    tos.sort_unstable_by(|&left, &right| {
        operations[right]
            .ts
            .cmp(&operations[left].ts)
            .then_with(|| operations[right].user_id.cmp(&operations[left].user_id))
    });
    for &to in tos.iter() {
        preorder_traversal(&operations, edges, to, ret)
    }
}

#[get("/rooms/<room_id>/operations")]
fn get_operations(room_id: i64) -> Result<Json<Vec<operation::Operation>>, Debug<Error>> {
    use std::str::FromStr;
    let conn = database_connection()?;

    let operations = schema::operations::table
        .filter(schema::operations::dsl::room_id.eq(room_id))
        .order(schema::operations::dsl::id.asc())
        .load::<operation::Operation>(&conn)
        .map_err(Error::from)?;

    // reconstruct a weave
    let mut id_to_index: HashMap<(Uuid, i64), usize> = HashMap::new();
    for (idx, op) in operations.iter().enumerate() {
        id_to_index.insert((op.user_id, op.ts), idx);
    }
    let mut edges = vec![vec![]; operations.len()];
    for op in operations.iter() {
        if op.user_id != op.parent_user_id || op.ts != op.parent_ts {
            let &parent_index = id_to_index.get(&(op.parent_user_id, op.parent_ts)).unwrap();
            let &child_index = id_to_index.get(&(op.user_id, op.ts)).unwrap();
            edges[parent_index].push(child_index)
        }
    }
    let &root_index = id_to_index
        .get(&(Uuid::from_str(SERVER_USER_ID).unwrap(), 1))
        .unwrap();
    let mut weave = vec![];
    preorder_traversal(&operations, &edges, root_index, &mut weave);

    Ok(Json(weave))
}

#[derive(Debug, Deserialize, Serialize)]
struct NewOperation {
    user_id: Uuid,
    ts: i64,
    parent_user_id: Uuid,
    parent_ts: i64,
    opcode: String,
    payload: serde_json::Value,
}

#[post("/rooms/<room_id>/operations", data = "<data>")]
fn post_operations(room_id: i64, data: Json<Vec<NewOperation>>) -> Result<(), Debug<Error>> {
    eprintln!("room_id = {}, data = {:?}", room_id, data);

    let conn = database_connection()?;

    diesel::insert_into(schema::operations::table)
        .values(
            &data
                .0
                .into_iter()
                .map(|op| operation::NewOperation {
                    room_id,
                    opcode: op.opcode,
                    payload: op.payload,
                    user_id: op.user_id,
                    ts: op.ts,
                    parent_user_id: op.parent_user_id,
                    parent_ts: op.parent_ts,
                })
                .collect::<Vec<_>>(),
        )
        .on_conflict_do_nothing()
        .execute(&conn)
        .map_err(Error::from)?;

    Ok(())
}

#[post("/new_room")]
fn new_room() -> Result<Json<i64>, Debug<Error>> {
    use schema::rooms::dsl;

    let conn = database_connection()?;

    let room = conn.transaction::<i64, Error, _>(|| {
        use std::str::FromStr;

        // create a new room
        let room = diesel::insert_into(schema::rooms::table)
            .default_values()
            .returning(dsl::id)
            .get_result::<i64>(&conn)
            .map_err(Error::from)?;

        // insert root node
        diesel::insert_into(schema::operations::table)
            .values(&operation::NewOperation {
                room_id: room,
                opcode: "root".into(),
                payload: serde_json::Value::Object(Default::default()),
                user_id: Uuid::from_str(SERVER_USER_ID).unwrap(),
                ts: 1,
                parent_user_id: Uuid::from_str(SERVER_USER_ID).unwrap(),
                parent_ts: 1,
            })
            .execute(&conn)?;

        Ok(room)
    })?;

    Ok(Json(room))
}

#[get("/rooms")]
fn get_rooms() -> Result<Json<Vec<i64>>, Debug<Error>> {
    let conn = database_connection()?;

    let rooms = schema::rooms::table
        .select(schema::rooms::dsl::id)
        .load::<i64>(&conn)
        .map_err(Error::from)?;

    Ok(Json(rooms))
}

fn run_migration() -> Result<(), Error> {
    embed_migrations!();

    let conn = database_connection()?;
    embedded_migrations::run(&conn).map_err(Into::into)
}

#[launch]
fn rocket() -> rocket::Rocket {
    let mut ok = false;
    for _ in 0..10 {
        match run_migration() {
            Ok(()) => {
                ok = true;
                break;
            }
            Err(e) => {
                eprintln!("{:?}", e);
                std::thread::sleep(std::time::Duration::from_secs(3));
            }
        }
    }
    assert!(ok);

    rocket::ignite()
        .mount("/", routes![new_path])
        .mount("/", routes![path])
        .mount("/", routes![get_operations, post_operations])
        .mount("/", routes![new_room, get_rooms])
}
