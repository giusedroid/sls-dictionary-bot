const { expect } = require("chai");
const modelFactory = require("../../lib/term.model");

const mockItem = {
    "ConsumedCapacity": {
        "CapacityUnits": 1,
        "TableName": "mock-dictbot-table"
    },
    "Item": {
        "Term": {
            "S": "help"
        },
        "Definition": {
            "S": "here is a helpful message"
        }
    }
};

const mockResolver = resolved => ({
    promise(){
        return Promise.resolve(resolved);
    }
});

const dynamoMock = {
    getItem: () => mockResolver(mockItem),
    putItem: () => mockResolver({}),
    deleteItem: () => mockResolver(mockItem)
};

const term = modelFactory(dynamoMock, "mock-dictbot-table");

describe("Term model", function(){
    describe("get", function(){
        it("should return a promise", () => {
            const returned = term.get("whatever");
            expect(returned).to.be.a("promise");
        });
        it("and such promise should return an dynamodb like object", done => {
            term.get("whatever").then(resolved => {
                expect(resolved).to.eql(mockItem);
            }).then(done);
        });
    });
    describe("update", function(){
        it("should return a promise", () => {
            const returned = term.update("whatever", "why not?");
            expect(returned).to.be.a("promise");
        });
        it("and such promise should return an empty object", done => {
            term.update("whatever", "yeah right?").then(resolved => {
                expect(resolved).to.eql({});
            }).then(done);
        });
    });
    describe("delete", function(){
        it("should return a promise", () => {
            const returned = term.delete("whatever");
            expect(returned).to.be.a("promise");
        });
        it("and such promise should return an dynamodb like object", done => {
            term.delete("whatever").then(resolved => {
                expect(resolved).to.eql(mockItem);
            }).then(done);
        });
    });
    describe("actionsFromDefinitions", () => {
        it("given a definition, it should execute the correct action", () => {
            const mockTerm = {
                whatever(){
                    return "whatever";
                }
            };
            const mockDef = {
                action: "whatever",
                term: "not a term",
                definition: "not a definition"
            };
            const {actionsFromDefinitions} = modelFactory({}, {});
            const expected = "whatever";
            expect(actionsFromDefinitions(mockTerm)(mockDef)()).to.eql(expected);
        });
        it("given a definition with no action, it should execute the default 'create' action", () => {
            const mockTerm = {
                create(){
                    return "create";
                }
            };
            const mockDef = {
                term: "not a term",
                definition: "not a definition"
            };
            const {actionsFromDefinitions} = modelFactory({}, {});
            const expected = "create";
            expect(actionsFromDefinitions(mockTerm)(mockDef)()).to.eql(expected);
        });
    });
});