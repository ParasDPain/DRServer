/** Neo4j database connector
 *
 * Written By:
 *         Paras DPain
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Paras DPain 2016.
 */
"use strict";

// REQUIRES
const neo4j = require("neo4j-driver").v1;
const db_auth = require("./config.json");

// GLOBALS
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic(db_auth.username, db_auth.pass));

// Method perform all queries to the database
exports.query = function(query, params, result, callback) {
    var session = driver.session();
    var collection = []; // Keep a record of all results
    session
        .run(query, params)
        .subscribe({
            onNext: function(record) {
                collection.push(record);
            },
            onCompleted: function() {
                if (result) {
                    result(collection);
                }
                session.close();
            },
            onError: function(err) {
                if (callback) {
                    callback(err);
                }
            }
        });
};
