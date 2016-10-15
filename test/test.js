/** Unit Tests for the DR API methods and implements
*
* Written By:
*         Paras DPain
*
* License:
*        MIT License. All code unless otherwise specified is
*        Copyright (c) Paras DPain 2016.
*/

// REQUIRES
const assert = require('assert');
const api = require('./../api.js');

// TESTS
describe('Connection', function() {
    var response;
    var result = function(res) {
        response = res
    };

    after(function() {
        // TODO runs after all tests in this block
        // Reset database here
    });

    describe('API Implements', function() {
        describe('#GetUser()', function(done) {
            it('should return [] when username is not found', function() {
                api.GetUser(
                    'qwerty',
                    function(res) {
                        assert.equal([], res);
                    },
                    null
                );
            });

            it('should return a valid user when valid username is given', function() {
                api.GetUser(
                    'foo',
                    function(res) {
                        assert.ok(res.length > 0);
                        var user = res[0].get("user").properties;
                        assert.ok(user.hasOwnProperty('username'));
                        assert.ok(user.hasOwnProperty('email'));
                        assert.ok(user.hasOwnProperty('pass'));
                        assert.ok(user.hasOwnProperty('score'));
                    },
                    null
                );
            });

            it('should return an error message when no username is given');

        });
    });
});
