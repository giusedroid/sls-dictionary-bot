const request = require("request-promise");
const { message } = require("./handler");
const { ServiceEndpoint } = require("./serverless-info");

const expect = require("chai").expect;

describe("My HTTP Lambda", () => {
    it("returns a message", done => {
        request.get(`${ServiceEndpoint}/hello`)
            .then(JSON.parse)
            .then(res => {
                expect(res.message).to.be.equal(message);
            })
            .then(done);
    });
});