use crate::schema::*;

use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Queryable, Deserialize, Serialize)]
pub struct Operation {
    pub id: i64,
    pub room_id: i64,
    pub user_id: Uuid,
    pub ts: i64,
    pub parent_user_id: Uuid,
    pub parent_ts: i64,
    pub opcode: String,
    pub payload: Value,
}

#[derive(Insertable)]
#[table_name = "operations"]
pub struct NewOperation {
    pub room_id: i64,
    pub user_id: Uuid,
    pub ts: i64,
    pub parent_user_id: Uuid,
    pub parent_ts: i64,
    pub opcode: String,
    pub payload: Value,
}
