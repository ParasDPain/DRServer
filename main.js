"use strict";

// requires
const neo4j = require("neo4j-driver").v1;
const db_auth = require("./config.json");

// globals
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic(db_auth.username, db_auth.pass));

// Testing
var session = driver.session();
session
    .run("MATCH (foo {username : {name} }) RETURN foo.email", { name : "foo"})
    .subscribe({
        onNext : function(record) {
            console.log(record);
        },
        onCompleted : function() {
            session.close();
        },
        onError : function(err) {
            console.log(err);
        }
    });

// TODO test transactions
