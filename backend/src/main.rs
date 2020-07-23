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
use rocket_contrib::json::Json;
use uuid::Uuid;

mod draw;
mod operation;
mod path;
mod room;
mod schema;

use path::Path;

fn database_connection() -> PgConnection {
    let url = std::env::var("DATABASE_URL").unwrap();
    PgConnection::establish(&url).unwrap()
}

#[get("/rooms/<room_id>/path")]
fn path(room_id: i64) -> Json<Vec<Path>> {
    let conn = database_connection();

    Json(
        schema::paths::table
            .inner_join(schema::draws::table)
            .filter(schema::draws::dsl::room_id.eq(room_id))
            .order(schema::paths::dsl::id.asc())
            .select((schema::paths::dsl::xs, schema::paths::dsl::ys))
            .load(&conn)
            .unwrap(),
    )
}

#[post("/rooms/<room_id>/new_path", data = "<data>")]
fn new_path(room_id: i64, data: Json<Path>) -> &'static str {
    eprintln!("{:?}", data);
    if data.xs.len() != data.ys.len() {
        return "invalid";
    }
    {
        let conn = database_connection();

        conn.transaction::<(), diesel::result::Error, _>(|| {
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
        .unwrap();
    }

    "Hello, world!"
}

#[get("/rooms/<room_id>/operations")]
fn get_operations(room_id: i64) -> Json<Vec<operation::Operation>> {
    let conn = database_connection();

    let operations = schema::operations::table
        .filter(schema::operations::dsl::room_id.eq(room_id))
        .load::<operation::Operation>(&conn)
        .unwrap();

    Json(operations)
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
fn post_operations(room_id: i64, data: Json<NewOperation>) {
    eprintln!("room_id = {}, data = {:?}", room_id, data);
    let NewOperation {
        user_id,
        ts,
        parent_user_id,
        parent_ts,
        opcode,
        payload,
    } = data.0;

    let conn = database_connection();

    diesel::insert_into(schema::operations::table)
        .values(&operation::NewOperation {
            room_id,
            user_id,
            ts,
            parent_user_id,
            parent_ts,
            opcode,
            payload,
        })
        .execute(&conn)
        .unwrap();
}

#[post("/new_room")]
fn new_room() -> Json<i64> {
    use schema::rooms::dsl;

    let conn = database_connection();

    let room = diesel::insert_into(schema::rooms::table)
        .default_values()
        .returning(dsl::id)
        .get_result::<i64>(&conn)
        .unwrap();
    Json(room)
}

#[get("/rooms")]
fn get_rooms() -> Json<Vec<i64>> {
    let conn = database_connection();

    let rooms = schema::rooms::table
        .select(schema::rooms::dsl::id)
        .load::<i64>(&conn)
        .unwrap();
    Json(rooms)
}

fn run_migration() -> Result<(), Box<dyn std::error::Error>> {
    embed_migrations!();

    let conn = database_connection();
    embedded_migrations::run(&conn).map_err(Into::into)
}

#[launch]
fn rocket() -> rocket::Rocket {
    while let Err(e) = run_migration() {
        eprintln!("{:?}", e);
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
    rocket::ignite()
        .mount("/", routes![new_path])
        .mount("/", routes![path])
        .mount("/", routes![get_operations, post_operations])
        .mount("/", routes![new_room, get_rooms])
}
