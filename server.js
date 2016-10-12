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
const bodyChecker = require('object-checker').bodyCheckMiddleware;
const bodyParser = require("body-parser");
const validator = require('validator');
const db = require('./api.js');
const checkerOptions = require('./checkerOptions.js')

// GLOBALS
var app = express();
var router = express.Router();
var port = process.env.PORT || 8080;

// CONFIG
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// TODO validate auth here
// middleware to use for all requests - order of declaration is important
router.use(function(req, res, next) {
    console.log('Request received');
    next(); // make sure we go to the next routes and don't stop here
});

/// ROUTES
// /api - test server status
router.get("/", function(req, res) {
    res.json({
        message: "We are live!"
    })
});

// POST /api/user - create a user
router.route('/user')

// POST
.post(bodyChecker(checkerOptions.userOptions), function(req, res) {
    // TODO hash passwords
    db.CreateUser(req.body.username, req.body.email, req.body.pass, function(result) {
        res.json({
            response: "User successfully created!"
        });
    }, function(err) {
        res.send(err);
    });
});

// GET /api/user/:username - get user details
router.route('/user/:username')

// GET
.get(function(req, res) {
    // NULL check
    if (req.params.username.match(/^[a-z]+$/g) == null) {
        res.json({
            response: "Invalid Username"
        });
        return;
    }

    db.GetUser(req.params.username, function(result) {
        // Check if rant not found
        if (result && result.length > 0) {
            // result.get(key) filters out the required object
            res.json(result[0].get("user").properties);
        } else {
            res.json({
                response: "User not found"
            })
        }
    }, function(err) {
        res.send(err);
    });
});

// GET /api/feed/:limit - get all rants
router.route('/feed/:limit')

// GET
.get(function(req, res) {
    // Limit type check
    var effectiveLimit;
    // http://stackoverflow.com/questions/1133770/how-do-i-convert-a-string-into-an-integer-in-javascript
    // + converts string to int
    if (Number.isInteger(+req.params.limit) && +req.params.limit > 0) {
        effectiveLimit = +req.params.limit;
    } else {
        effectiveLimit = 10; // DEFAULT
    }

    db.GetRants(effectiveLimit, function(result) {
        // filter and fill array with results
        var array = [];
        result.forEach(function(record) {
            array.push(record.get("rants").properties);
        });
        res.json(array);
    }, function(err) {
        res.send(err);
    });
});

// GET /api/rant/:rantId
router.route('/rant/:rantId')

// GET - get a rant
.get(function(req, res) {
    // Id format validation and string injection guard
    var id = req.params.rantId;
    // REGEX : start of string + 1 instance of char between [a-z] + integer of any length + end of string
    if (id.match(/^[a-z]\d+$/g) == null) {
        res.json({
            response: "Invalid Id"
        })
        return;
    }
    db.GetRant(id, function(result) {
        // Check if rant not found
        if (result.length > 0) {
            res.json(result[0].get("rant").properties);
        } else {
            res.json({
                response: "Rant not found"
            });
        }
    }, function(err) {
        res.send(err);
    });
});

// POST-PUT-DELETE /api/rant
router.route('/rant')

// POST - create a rant
.post(bodyChecker(checkerOptions.rantCreateOptions), function(req, res) {

    // NULL checks
    if (req.body.username.length > 0) {
        res.json({
            response: "Username missing"
        })
        return;
    } else if (req.body.rantText.length > 0) {
        res.json({
            response: "Rant text missing"
        })
        return;
    }

    // Tags are optional
    var tags = req.body.tags;
    if (tags == null || tags.length < 1) {
        tags = [];
    }

    db.CreateRant(req.body.username, req.body.rantText, tags,
        function(result) {
            res.json({
                response: "Rant created successfully!"
            });
        },
        function(err) {
            res.send(err);
        });
})

// PUT - upvote the rant
.put(bodyChecker(checkerOptions.rantVoteOptions), function(req, res) {
    // TODO check username, rantId
    db.UpvoteRant(req.body.username, req.body.rantId,
        function(result) {
            res.json({
                response: "Rant upvoted successfully!"
            });
        },
        function(err) {
            res.send(err);
        });
})

// TODO use of DELETE request is misleading
// DELETE - downvote the rant
.delete(bodyChecker(checkerOptions.rantVoteOptions), function(req, res) {
    // TODO check username, rantId
    db.DownvoteRant(req.body.username, req.body.rantId,
        function(result) {
            res.json({
                response: "Rant downvoted successfully!"
            });
        },
        function(err) {
            res.send(err);
        });
});


// GET /api/rant/:rantId/comment
router.route('/rant/:rantId/comment')

// GET - get all comments for a rant
.get(function(req, res) {
    // Id format validation and string injection guard
    var id = req.params.rantId;
    // REGEX : start of string + 1 instance of char between [a-z] + integer of any length + end of string
    if (id.match(/^[a-z]\d+$/g) == null) {
        res.json({
            response: "Invalid Id"
        })
        return;
    }
    db.GetComments(id, function(result) {
        // filter and fill array with results
        var array = [];
        result.forEach(function(record) {
            array.push(record.get("comments").properties);
        });
        res.json(array);
    }, function(err) {
        res.send(err);
    });
});

// POST-PUT-DELETE /api/rant/comment
router.route('/rant/comment')

// POST - Add a new comment
.post(bodyChecker(checkerOptions.commentCreateOptions), function(req, res) {
    // TODO check username, rantId, commentText
    db.CreateComment(req.body.username, req.body.rantId, req.body.commentText,
        function(result) {
            res.json({
                response: "Comment added successfully!"
            });
        },
        function(err) {
            res.send(err);
        });
})

// PUT - upvote the comment
.put(bodyChecker(checkerOptions.commentVoteOptions), function(req, res) {
    db.UpvoteComment(req.body.username, req.body.commentId,
        function(result) {
            res.send("Comment upvoted successfully!");
        },
        function(err) {
            res.send(err);
        });
})

// DELETE - downvote the comment
.delete(bodyChecker(checkerOptions.commentVoteOptions), function(req, res) {
    db.DownvoteRant(req.body.username, req.body.commentId,
        function(result) {
            res.send("Comment downvoted successfully!");
        },
        function(err) {
            res.send(err);
        });
});

// REGISTER ROUTES
app.use("/api", router);

// MAIN
app.listen(port);
console.log("The server has started");
