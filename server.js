/** DR Starts server and API listeners
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
const express = require("express");
const bodyParser = require("body-parser");
const db = require('./dbconnector.js');

// GLOBALS
var app = express();
var router = express.Router();
var port = process.env.PORT || 8080;

// CONFIG
app.use(bodyParser.urlencoded(
    {
         extended : true
    }
));
app.use(bodyParser.json());

// TODO validate auth here
// middleware to use for all requests - order of declaration is important
router.use(function(req, res, next) {
    console.log('Request received')
    next(); // make sure we go to the next routes and don't stop here
});

/// ROUTES
// /api - test server status
router.get("/", function(req, res) {
    res.json(
        {
            message : "We are live!"
        }
    )
});

// POST /api/user - create a user
router.route('/user')

    // POST
    .post(function(req, res) {
        // TODO hash passwords
        db.CreateUser(req.body.username, req.body.email, req.body.pass, function(result) {
            res.send("User successfully created!");
        }, function(err) {
            res.send(err);
        });
    });

// GET /api/user/:username - get user details
router.route('/user/:username')

    // GET
    .get(function(req, res) {
        db.GetUser(req.params.username, function(result) {
            // Check if rant not found
            if(result.length > 0) {
                 // result.get(key) filters out the required object
                res.json(result[0].get("user"));
            } else{
                res.send("User not found")
            }
        }, function(err) {
            res.send(err);
        });
    });

// GET /api/feed/:limit - get all rants
router.route('/feed/:limit')

    // GET
    .get(function(req, res) {
        // http://stackoverflow.com/questions/1133770/how-do-i-convert-a-string-into-an-integer-in-javascript
        // + converts string to int
        db.GetRants(+req.params.limit, function(result) {
            // filter and fill array with results
            var array = [];
            result.forEach(function(record) {
                array.push(record.get("rants"));
            });
            res.json(array);
        }, function(err) {
            res.send(err);
        });
    });

// POST /api/rant - create a rant
router.route('/rant')

    //POST
    .post(function(req, res) {

        // NULL checks
        if(req.body.username == null) {
            res.send("Username missing")
            return;
        } else if(req.body.rantText == null){
            res.send("Rant text missing")
            return;
        }

        // Tags are optional
        var tags = req.body.tags;
        if(tags == null) {
            tags = [];
        }

        db.CreateRant(req.body.username, req.body.rantText, tags,
        function(result) {
            res.send("Rant created successfully!");
        }, function(err) {
            res.send(err);
        });
    });

// GET /api/rant/:rantId
router.route('/rant/:rantId')

    // GET - get a rant
    .get(function(req, res) {
        db.GetRant(req.params.rantId, function(result) {
            // Check if rant not found
            if(result.length > 0) {
                res.json(result[0].get("rant"));
            } else{
                res.send("Rant not found")
            }
        }, function(err) {
            res.send(err);
        });
    })

    // PUT - upvote the rant
    .put(function(req, res) {
        db.UpvoteRant(req.body.username, req.body.rantId,
        function(result) {
            res.send("Rant upvoted successfully!");
        }, function(err) {
            res.send(err);
        });
    })

    // DELETE - downvote the rant
    .delete(function(req, res) {
        db.DownvoteRant(req.body.username, req.body.rantId,
        function(result) {
            res.send("Rant downvoted successfully!");
        }, function(err) {
            res.send(err);
        });
    });

// GET-POST /api/rant/:rantId/comment
router.route('/rant/:rantId/comment')

    // GET - get all comments for a rant
    .get(function(req, res) {
        db.GetComments(req.params.rantId, function(result) {
            // filter and fill array with results
            var array = [];
            result.forEach(function(record) {
                array.push(record.get("comments"));
            });
            res.json(array);
        }, function(err) {
            res.send(err);
        });
    })

    // POST - Add a new comment
    .post(function(req, res) {
        db.CreateComment(req.body.username, req.body.rantId, req.body.commentText,
        function(result) {
            res.send("Comment added successfully!");
        }, function(err) {
            res.send(err);
        });
    });

// PUT-DELETE /api/rant/:rantId/:commentId
router.route('/rant/:rantId/:commentId')

    // PUT - upvote the comment
    .put(function(req, res) {
        db.UpvoteComment(req.body.username, req.body.commentId,
        function(result) {
            res.send("Comment upvoted successfully!");
        }, function(err) {
            res.send(err);
        });
    })

    // DELETE - downvote the comment
    .delete(function(req, res) {
        db.DownvoteRant(req.body.username, req.body.commentId,
        function(result) {
            res.send("Comment downvoted successfully!");
        }, function(err) {
            res.send(err);
        });
    });

// REGISTER ROUTES
app.use("/api", router);

// MAIN
app.listen(port);
console.log("The server has started");
