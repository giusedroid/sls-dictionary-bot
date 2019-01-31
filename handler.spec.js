const handler = require('./handler');

describe("The handler function", () => {
    it("returns a message", () => {
        handler.hello(null, null, function(error, response){
            const body = JSON.parse(response.body);
            body.message.should.be.equal(handler.message);
        });
    });
});