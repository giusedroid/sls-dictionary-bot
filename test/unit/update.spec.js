const handler = require("../../handlers/update");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const R = require("ramda");
const { expect } = require("chai");

describe("The S3 to DynamoDB Pipeline", function(){
    
    it("executes correctly", done => {
        const { itemsFromEvent } = require("../../lib/bucket.model")({}, "");
    
        const mockActions = R.identity;
        const mockEvent = require("../assets/s3event.test");
        const mockDownload = key => readFile(`./${key}`);
        const decode = buffer => JSON.parse(buffer.toString("utf-8"));
        
        const mockBucket = {
            itemsFromEvent: itemsFromEvent,
            decode: decode,
            download: mockDownload
        };
        const update = handler.testUpdateF(mockActions, mockBucket, R.identity );
        update(mockEvent)
            .then( res => {expect(res.length).to.equal(7);})
            .then( done );
    });
});