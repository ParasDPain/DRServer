/** Contains implements of all API methods
 *
 * Written By:
 *         Paras DPain
 *
 * License:
 *        MIT License. All code unless otherwise specified is
 *        Copyright (c) Paras DPain 2016.
 */
"use strict";

// TODO scores missing from rants

// REQUIRES
const async = require('async');
const queryDB = require('./dbconnector.js').query;

// HELPER METHODS
// Method checks relationships between two nodes and performs operations selectively
var performVotes = function(primaryNode, secondaryNode, pValue, sValue, novote, callback) {
    var relationshipType;
    // fetch existing relationship between the nodes
    async.series([
        function fn(cb) {
            queryDB(
                "MATCH (primary : " + primaryNode[0] + " {" + primaryNode[1] + " : {pKey} })" +
                "-[relationship]->" +
                "(secondary : " + secondaryNode[0] + " {" + secondaryNode[1] + " : {sKey} }) " +
                "RETURN type(relationship) AS relationship",
                {
                    pKey: pValue,
                    sKey: sValue
                },
                function(result) {
                    if(result.length > 0) {
                        relationshipType = result[0].get("relationship") + "";
                    } else {
                        relationshipType = "";
                    }
                    cb(null, "");
                },
                function(err) {
                    callback(err);
                    return; // stop further processing
                }
            );
        },
        // Redundant wrap required for async
        function switchByResult() {
            switch (relationshipType) {
                case "COMMENTED": // Operation not allowed
                    callback("Cannot vote your own comments");
                    break;
                case "RANTED": // Operation not allowed
                    callback("Cannot vote your own rants");
                    break;
                case "UPVOTED": // already upvoted
                    callback("Node is already upvoted");
                    break;
                case "DOWNVOTED": // already downvoted
                    callback("Node is already downvoted");
                    break;
                case "": // No relationship found
                    if (novote) {
                        novote();
                    };
                    break;
                default: // Unknown relationship found
                    callback("Unknown relationship status found");
                    cb(null, "");
            };
        }
    ]);
};

// GLOBALS
var rantCount = 0;
// Fetch current rant count
queryDB("MATCH (r : Rant) RETURN count(*) AS count", {}, function(result) {
    rantCount = result[0].get("count").toString();
}, function(err) {
    console.error(err.message);
});
// async.series helper method
var cb = function(err, result) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(result);
    }
}

// API Implements
exports.GetUser = function(username, result, callback) {
    var foundUser;
    var score;

    // Find scores ((upvoted rants - downvoted rants) + (upvoted comments - downvoted comments))
    // TODO simplify into a single CYPHER query
    async.series([
        // Upvoted rants
        function fn(cb) {
            queryDB(
                "MATCH (user : User {username : {uname} }) " +
                "MATCH (user)-[:RANTED]->(rants : Rant) " +
                "MATCH (:User)-[uprants : UPVOTED]->(rants) " +
                "RETURN COUNT(uprants) AS count", {
                    uname: username
                },
                function(countRes) {
                    score = countRes[0].get("count").toNumber();
                    cb(null, "");
                },
                callback);
        },

        // Downvoted rants
        function fn(cb) {
            queryDB(
                "MATCH (user : User {username : {uname} }) " +
                "MATCH (user)-[:RANTED]->(rants : Rant) " +
                "MATCH (:User)-[downrants : DOWNVOTED]->(rants) " +
                "RETURN COUNT(downrants) AS count", {
                    uname: username
                },
                function(countRes) {
                    score -= countRes[0].get("count").toNumber();
                    cb(null, "");
                },
                callback);
        },

        // Upvoted comments
        function fn(cb) {
            queryDB(
                "MATCH (user : User {username : {uname} }) " +
                "MATCH (user)-[:COMMENTED]->(coms : Comment) " +
                "MATCH (:User)-[upcoms : UPVOTED]->(coms) " +
                "RETURN COUNT(upcoms) AS count", {
                    uname: username
                },
                function(countRes) {
                    score += countRes[0].get("count").toNumber();
                    cb(null, "");
                },
                callback);
        },

        // Downvoted comments
        function fn(cb) {
            queryDB(
                "MATCH (user : User {username : {uname} }) " +
                "MATCH (user)-[:COMMENTED]->(coms : Comment) " +
                "MATCH (:User)-[downcoms : DOWNVOTED]->(coms) " +
                "RETURN COUNT(downcoms) AS count", {
                    uname: username
                },
                function(countRes) {
                    score -= countRes[0].get("count").toNumber();
                    cb(null, "");
                },
                callback);
        },

        // Get User and add calculated scoee
        function fn(cb) {
            queryDB("MATCH (user : User {username : {uname} }) RETURN user", {
                    uname: username
                },
                function(finalRes) {
                    if (finalRes.length > 0) { // NULL CHECK
                        finalRes[0].get("user").properties["score"] = score;
                    }
                    result(finalRes); // return
                    cb(null, "");
                },
                callback);
        }
    ]);
};

exports.CreateUser = function(username, email, passHash, result, callback) {
    queryDB(
        "MERGE (user : User {username : {uname}, email : {uemail}, hash : {uhash} }) " +
        "ON MERGE RETURN TRUE", // return true if user already exists
        {
            uname: username,
            uemail: email,
            uhash: passHash
        },
        result,
        callback);
};

exports.GetRants = function(resultLimit, result, callback) {
    var rantArray;
    async.series([
        function fn(cb) {
            queryDB("MATCH (rants : Rant) RETURN rants LIMIT {limit}", {
                limit: resultLimit
            },
            function(res) {
                rantArray = res;
                cb(null, "");
            },
            callback);
        },

        // Foreach rant, add it's score
        // TODO multiple calls should be fixed by refactoring the database design
        function fn(cb) {
            var callCount = 0; // HACK to enforce all function calls to return
            async.eachOf(rantArray, function(element, index , cbb) {
                queryDB(
                    "OPTIONAL MATCH (user : User)-[:UPVOTED]->(:Rant {id : {rid} }) " +
                    "WITH COUNT(user) AS upvotes " +
                    "OPTIONAL MATCH (user : User)-[:DOWNVOTED]-(:Rant {id : {rid} }) " +
                    "WITH upvotes - COUNT(user) AS count " +
                    "OPTIONAL MATCH (user : User)-[:RANTED]->(:Rant {id : {rid} }) " +
                    "RETURN user AS author, count", {
                        rid: element.get("rants").properties.id
                    },
                    function(res) {
                        element.get("rants").properties["score"] = res[0].get("count").toNumber();
                        element.get("rants").properties["author"] = res[0].get("author");
                        console.log(res[0].get("count").toNumber());
                        console.log(res[0].get("author"));

                        callCount++;
                        // HACK callback
                        if(callCount === rantArray.length) {
                            console.log("we here with array as");
                            result(rantArray);
                            cb(null, "");
                        }
                    },
                    callback);
            }, function (err) {
                if(err) {
                    console.error(err.message);
                }
            });
        }
    ]);
};

exports.GetRant = function(rantId, result, callback) {
    var score;
    async.series([
        // User Votes
        function fn(cb) {
            queryDB(
                "OPTIONAL MATCH (user : User)-[:UPVOTED]->(:Rant {id : {rid} }) " +
                "WITH COUNT(user) AS upvotes " +
                "OPTIONAL MATCH (user : User)-[:DOWNVOTED]-(:Rant {id : {rid} }) " +
                "RETURN upvotes - COUNT(user) AS count", {
                    rid: rantId
                },
                function(countRes) {
                    score = countRes[0].get("count").toNumber();
                    cb(null, "");
                },
                callback);
        },

        // Get Rant details
        function fn(cb) {
            queryDB("MATCH (user: User)-[:RANTED]->(rant : Rant {id : {rid} }) RETURN user, rant", {
                    rid: rantId
                },
                function(finalRes) {
                    if (finalRes.length > 0) { // NULL CHECK
                        finalRes[0].get("rant").properties["score"] = score;
                        finalRes[0].get("rant").properties["author"] = author;
                    }
                    result(finalRes); // return
                    cb(null, "");
                },
                callback);
        }
    ]);
};

exports.CreateRant = function(username, rantText, tags, result, callback) {
    queryDB(
        "MATCH (user : User {username: {uname} }) " +
        "CREATE (rant : Rant {id : {rid}, text : {rText}, tags : {rTags} })" +
        "CREATE (user)-[:RANTED {on: {time} }]->(rant)", {
            uname: username,
            rid: "r" + ++rantCount,
            rText: rantText,
            rTags: tags,
            time: Date.now()
        },
        result,
        callback);
};

exports.GetComments = function(rantId, result, callback) {
    queryDB(
        "OPTIONAL MATCH (rant : Rant {id : {rid} })" +
        "-[:HAS_COMMENT]->" +
        "(comments : Comment) RETURN comments", {
            rid: rantId
        },
        result,
        callback);
};

exports.CreateComment = function(username, rantId, commentText, result, callback) {
    // Fetch comment count
    var commentCount = 0;
    queryDB(
        "OPTIONAL MATCH (r : Rant {id : {rid} })" +
        "-[c : HAS_COMMENT]->" +
        "(:Comment) RETURN count(c) AS count", {
            rid: rantId
        },
        function(res) {
            commentCount = res[0].get("count").toString(); // fetch current rant count

            // Inject main function
            queryDB(
                "MATCH (user : User {username: {uname} }) " +
                "MATCH (rant : Rant {id : {rid} })" +
                "CREATE (com : Comment {id : {cid}, text : {cText} })" +
                "CREATE (rant)-[:HAS_COMMENT {on: {time} }]->(com)" +
                "CREATE (user)-[:COMMENTED]->(com)", {
                    uname: username,
                    rid: rantId,
                    cid: "c" + ++commentCount,
                    cText: commentText,
                    time: Date.now()
                },
                result,
                callback);

        },
        function(err) {
            console.error(err.message);
        });
};

/*
 * Voting API functions lineraly and leaves UX features of toggling votes to the frontend
 */
 // TODO Implement checks for non matches to protect against wrong input
exports.UpvoteRant = function(username, rantId, result, callback) {
    performVotes(["User", "username"], ["Rant", "id"], username, rantId,
        function() {
            queryDB(
                "MATCH (user : User {username: {uname} }) " +
                "MATCH (rant : Rant {id : {rid} }) " +
                "CREATE (user)-[:UPVOTED]->(rant) ", {
                    uname: username,
                    rid: rantId
                },
                function(res) {
                    result("Rant upvoted successfully!")
                },
                callback);
        },
        callback);
};

exports.DownvoteRant = function(username, rantId, result, callback) {
    performVotes(["User", "username"], ["Rant", "id"], username, rantId,
        function() {
            queryDB(
                "MATCH (user : User {username : {uname} })" +
                "-[relationship : DOWNVOTED]->" +
                "MATCH (rant : Rant {id : {rid} }) " +
                "DELETE relationship", {
                    uname: username,
                    rid: rantId
                },
                function(res) {
                    result("Rant downvoted successfully!")
                },
                callback);
        },
        callback);
};

exports.UpvoteComment = function(username, commentId, result, callback) {
    performVotes(["User", "username"], ["Comment", "id"], username, commentId,
        function() {
            queryDB(
                "MATCH (user : User {username: {uname} }) " +
                "MATCH (com : Comment {id : {cid} }) " +
                "CREATE (user)-[:UPVOTED]->(com)", {
                    uname: username,
                    cid: commentId
                },
                function(res) {
                    result("Comment upvoted successfully!")
                },
                callback);
        },
        callback);
};

exports.DownvoteComment = function(username, commentId, result, callback) {
    performVotes(["User", "username"], ["Comment", "id"], username, commentId,
        function() {
            queryDB(
                "MATCH (user : User {username : {uname} })" +
                "-[relationship : DOWNVOTED]->" +
                "MATCH (com : Comment {id : {cid} })" +
                "DELETE relationship", {
                    uname: username,
                    cid: commentId
                },
                function(res) {
                    result("Comment downvoted successfully!")
                },
                callback);
        },
        callback);
};
