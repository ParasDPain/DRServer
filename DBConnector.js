/** Module connects to the database and forwards queries
*
* Written By:
*         Paras DPain
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Paras DPain 2016.
*/
"use strict";

// requires
const neo4j = require("neo4j-driver").v1;
const db_auth = require("./config.json");

// globals
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic(db_auth.username, db_auth.pass));

// Provided functions
exports.CreateUser = function(username, email, passHash) {

};

exports.CreateRant = function(username, rantText, tags) {

};

exports.AddComment = function(username, rantId, commentText) {

};

exports.UpvoteRant = function(username, rantId) {

};

exports.DownvoteRant = function(username, rantId) {

};

exports.UpvoteComment = function(username, commentId) {

};

exports.DownvoteComment = function(username, commentId) {

};

/* Testing
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
*/
