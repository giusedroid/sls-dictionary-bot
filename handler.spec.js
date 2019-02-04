const handler = require("./handler");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const R = require("ramda");
const { expect } = require("chai");
const sinon = require("sinon");

describe("Dictionary endpoint handler", function() {
    it("returns a challenge if the chanllenge is in the message", async () => {
        const mockEvent = require("./assets/apiGatewayEventChallenge.test");
        const { challenge, token }  = R.compose(JSON.parse, R.path(["body"]))(mockEvent);
        const dictionary = handler.testDictionaryF({}, token);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["challenge"], responseBody)).to.eql(challenge);
    });
    
    it("returns a friendly message if no CHALLENGE_TOKEN is set for this function.", async () => {
        const mockEvent = require("./assets/apiGatewayEventChallenge.test");
        const dictionary = handler.testDictionaryF({}, null);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("Challenge token found and logged in cloudwatch. Use CHALLENGE TOKEN FOUND to filter.");
    });
    
    it("ignores the message if it's coming from another bot or self", async () => {
        const mockEvent = require("./assets/apiGatewayEventFromBot.test");
        const dictionary = handler.testDictionaryF({}, null);
        const response = await dictionary(mockEvent);
        expect(response).to.equal("200 OK");
    });
    
    it("replies with a definition if it's in the db", async () => {
        const mockEvent = require("./assets/apiGatewayEventOK.test");
        const mockDynamoResponse = require("./assets/dynamo.response");
        const expectedResponse = "OK";
        const mockTerm = {
            get(){
                return Promise.resolve( mockDynamoResponse );
            }
        };
        const mockBot = {
            chat:{
                postMessage(){
                    return Promise.resolve( expectedResponse );
                }
            }
        };

        const dictionary = handler.testDictionaryF(mockTerm, "", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
    });

    it("replies with a default message if the term is not in the db", async () => {
        const mockEvent = require("./assets/apiGatewayEventOK.test");
        const expectedResponse = {
            text: "sorry"
        };
        const mockTerm = {
            get(){
                return Promise.resolve( {} );
            }
        };
        const mockBot = {
            chat: {
                postMessage(){
                    return Promise.resolve( expectedResponse );
                }
            }
        };

        const dictionary = handler.testDictionaryF(mockTerm, "", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
    });

    it("replies with a default message if the bot wasn't able to get a term to search", async () => {
        const mockEvent = require("./assets/apiGatewayEventNOK.test");
        const expectedResponse = {
            text: "sorry"
        };
        const mockTerm = {
            get: sinon.spy()
        };
        const mockBot = {
            chat: {
                postMessage(){
                    return Promise.resolve( expectedResponse );
                }
            }
        };

        const dictionary = handler.testDictionaryF(mockTerm, "", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
        expect(mockTerm.get.callCount).to.eql(0);
    });
    
});

describe("The S3 to DynamoDB Pipeline", function(){
    
    it("executes correctly", done => {
        const { itemsFromEvent } = require("./lib/bucket.model")({}, "");
    
        const mockActions = R.identity;
        const mockEvent = require("./assets/s3Event.test");
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