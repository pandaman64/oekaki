use crate::schema::*;

#[derive(Insertable)]
#[table_name = "draws"]
pub struct NewDraw {
    pub room_id: i64,
    pub path_id: i64,
}
