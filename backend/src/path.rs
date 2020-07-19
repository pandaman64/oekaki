use crate::schema::*;

#[derive(Insertable)]
#[table_name = "paths"]
pub struct NewPath<'a> {
    pub xs: &'a [f64],
    pub ys: &'a [f64],
}

#[derive(Debug, Deserialize, Serialize, Queryable)]
pub struct Path {
    pub xs: Vec<f64>,
    pub ys: Vec<f64>,
}