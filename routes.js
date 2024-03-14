const routes = require("next-routes")();

module.exports = routes;
//add dynamic route 
routes.add("passwordchange", "/passwordchange/:id", "passwordchange");
