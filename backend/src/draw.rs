use crate::schema::*;

#[derive(Insertable)]
#[table_name = "draws"]
pub struct NewDraw {
    pub room_id: i32,
    pub path_id: i32,
}
