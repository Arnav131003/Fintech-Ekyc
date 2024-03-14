//create a database connection
const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "Your database host",
  user: "Your database user",
  password: "Your data password",
  database: "Your database name",
  multipleStatements: true
});
connection.connect(err => {
  if (err) {
    return err;
  }
});

module.exports.connection = connection;
