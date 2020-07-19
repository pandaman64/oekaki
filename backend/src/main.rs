#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde;

use diesel::pg::PgConnection;
use diesel::prelude::*;
use rocket_contrib::json::Json;

mod draw;
mod path;
mod schema;

use path::Path;

fn database_connection() -> PgConnection {
    let url = std::env::var("DATABASE_URL").unwrap();
    PgConnection::establish(&url).unwrap()
}

#[get("/rooms/<room_id>/path")]
fn path(room_id: i32) -> Json<Vec<Path>> {
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
fn new_path(room_id: i32, data: Json<Path>) -> &'static str {
    eprintln!("{:?}", data);
    if data.xs.len() != data.ys.len() {
        return "invalid";
    }
    {
        let conn = database_connection();

        conn.transaction::<(), diesel::result::Error, _>(|| {
            let path_id: i32 = diesel::insert_into(schema::paths::table)
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

#[launch]
fn rocket() -> rocket::Rocket {
    rocket::ignite().mount("/", routes![new_path]).mount("/", routes![path])
}
