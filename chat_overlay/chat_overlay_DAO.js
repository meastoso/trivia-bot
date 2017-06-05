/**
 * DAO with interfaces for the data source
 */







// Writing...
var fs = require("fs");
var myJson = {
    key: "myvalue"
};

fs.writeFile( "filename.json", JSON.stringify( myJson ), "utf8", yourCallback );

// And then, to read it...
myJson = require("./filename.json");