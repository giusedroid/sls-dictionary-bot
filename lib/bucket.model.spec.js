const { expect } = require("chai");
const modelFactory = require("./bucket.model");

const mockResolver = resolved => ({
    promise(){
        return Promise.resolve(resolved);
    }
});

describe("Bucket model", function(){
    describe("download", function(){
        const mockS3Object = {};
        
        const mockS3 = {
            getObject(){
                return mockResolver(mockS3Object);
            }
        };
        const bucket = modelFactory(mockS3, "mock-dictbot-bucket");

        it("should return a promise", () => {
            const returned = bucket.download("whatever");
            expect(returned).to.be.a("promise");
        });
        it("and such promise should return an s3 like object", done => {
            bucket.download("whatever").then(resolved => {
                expect(resolved).to.eql(mockS3Object);
            }).then(done);
        });
    });
});