/** Validation options for object-checker to validate incoming requests
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
const validator = require('validator');

// CHECKER OPTIONS
exports.userCreateOptions = {
    username: {
        $matchRegExp: /^[a-z]+$/
    },
    email: {
        $assertTrue: validator.isEmail
    },
    pass: {
        // TODO
    }
};
exports.rantCreateOptions = {
    username: {
        $matchRegExp: /^[a-z]+$/g
    },
    rantText: {
        $minLength: 1
    },
    tags: {
        $isOptional: true,
        $isArray: true
    }
};
exports.rantVoteOptions = {
    username: {
        $matchRegExp: /^[a-z]+$/g
    },
    rantId: {
        $matchRegExp: /^[a-z]\d+$/g
    }
}
exports.commentCreateOptions = {
    username: {
        $matchRegExp: /^[a-z]+$/g
    },
    rantId: {
        $matchRegExp: /^[a-z]\d+$/g
    },
    commentText: {
        $minLength: 1
    }
};
exports.commentVoteOptions = {
    username: {
        $matchRegExp: /^[a-z]+$/g
    },
    commentId: {
        $matchRegExp: /^[a-z]\d+$/g
    }
};
