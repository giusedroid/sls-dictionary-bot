const handler = require("./handler");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const R = require("ramda");
const { expect } = require("chai");

describe("The handler function", () => {
    it.skip("returns a message", () => {
        handler.hello(null, null, function(error, response){
            const body = JSON.parse(response.body);
            body.message.should.be.equal(handler.message);
        });
    });
});

describe("The S3 to DynamoDB Pipeline", function(){
    const bucket = require("./lib/bucket.model")({}, "");
    const mockActions = R.identity;
    const mockEvent = require("./assets/s3Event");
    const mockDownload = () => readFile("./assets/help.json");
    const mockBucket = {
        itemsFromEvent: bucket.itemsFromEvent,
        decode: bucket.decode,
        download: mockDownload
    };
    
    it("executes", done => {
        const update = handler.testUpdateF(mockActions, mockBucket, R.identity );
        update(mockEvent)
            .then( res => {expect(res.length).to.equal(8);})
            .then( done );
    });
});