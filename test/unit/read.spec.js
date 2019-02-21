const handler = require("../../handlers/read");
const R = require("ramda");
const { expect } = require("chai");
const sinon = require("sinon");

describe("Dictionary endpoint handler", function() {
    it("returns a challenge if the chanllenge is in the message", async () => {
        const mockEvent = require("../assets/apiGatewayEventChallenge.test");
        const { challenge, token }  = R.compose(JSON.parse, R.path(["body"]))(mockEvent);
        const dictionary = handler.testReadF({}, token);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["challenge"], responseBody)).to.eql(challenge);
    });
    
    it("returns a friendly message if no CHALLENGE_TOKEN is set for this function.", async () => {
        const mockEvent = require("../assets/apiGatewayEventChallenge.test");
        const dictionary = handler.testReadF({}, null);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("Challenge token found and logged in cloudwatch. Use CHALLENGE TOKEN FOUND to filter.");
    });
    
    it("ignores the message if it's coming from another bot or self", async () => {
        const mockEvent = require("../assets/apiGatewayEventFromBot.test");
        const dictionary = handler.testReadF({}, "not a token");
        const response = await dictionary(mockEvent);
        expect(response).to.equal("200 OK");
    });
    
    it("replies with a definition if it's in the db", async () => {
        const mockEvent = require("../assets/apiGatewayEventOK.test");
        const mockDynamoResponse = require("../assets/dynamo.response");
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

        const dictionary = handler.testReadF(mockTerm, "not a token", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
    });

    it("replies with a default message if the term is not in the db", async () => {
        const mockEvent = require("../assets/apiGatewayEventOK.test");
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

        const dictionary = handler.testReadF(mockTerm, "not a token", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
    });

    it("replies with a default message if the bot wasn't able to get a term to search", async () => {
        const mockEvent = require("../assets/apiGatewayEventNOK.test");
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

        const dictionary = handler.testReadF(mockTerm, "not a token", mockBot);
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(200);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("200 OK");
        expect(R.path(["messageSent"], responseBody)).to.eql(expectedResponse);
        expect(mockTerm.get.callCount).to.eql(0);
    });

    it("replies 403 if token is not found", async () => {
        const mockEvent = require("../assets/apiGatewayEventNOK.missingToken");
        const dictionary = handler.testReadF({}, "not a token");
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(403);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("Unauthorized");
    });

    it("replies 403 if token is wrong", async () => {
        const mockEvent = require("../assets/apiGatewayEventNOK.wrongToken");
        const dictionary = handler.testReadF({}, "this is not a token, but it's wrong");
        const {statusCode, body} = await dictionary(mockEvent);
        expect(statusCode).to.equal(403);
        const responseBody = JSON.parse(body);
        expect(R.path(["message"], responseBody)).to.eql("Unauthorized");
    });
    
});
