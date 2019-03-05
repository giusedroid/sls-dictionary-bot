const request = require("request-promise");
const AWS = require("aws-sdk");
const R = require("ramda");
const Slack = require("slack");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);

const { ServiceEndpoint,
    DefinitionBucketName,
    DefinitionTableName
} = require("../../serverless-info");

const expect = require("chai").expect;

const region = process.env.AWS_REGION || "eu-west-1";
const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_TEST_CHANNEL;
const challenge = process.env.SLACK_CHALLENGE_TOKEN;

AWS.config.update({ region });

// dynamo :: DynamoDB Client
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-10-08"});
// term :: Term Model
const term = require("../../lib/term.model")(dynamo, DefinitionTableName);

// s3 :: S3 Client
const s3 = new AWS.S3({ apiVersion: "2006-03-01"});

// bot :: Slack Bot
const bot = new Slack( { token });

// delay :: Int -> Promise
const delay = dt => new Promise(resolve => { setTimeout(resolve, dt); } );

// postMessageF :: String -> String -> String -> Promise
const postMessageF = (token, channel) => text => bot.chat.postMessage({token, channel, text});

// postMessage :: String -> Promise
const postMessage = postMessageF(token, channel);


describe("DictBot End to End test!", async function() {
    this.timeout(30000);
    
    const context = {
        s3: [],
        dynamo: []
    };
    
    this.beforeAll(
        async function(){
            if(channel && challenge){
                await postMessage("DictBot - e2e - begin");
            }
        }
    );

    this.afterAll(
        function(done){
            console.log("deleting test artifacts");
            const s3Deletes = context.s3.map( each => s3.deleteObject(each).promise());
            const dynamoDeletes = context.dynamo.map( each => term.delete(each));
            Promise
                .all([ ...s3Deletes, ...dynamoDeletes])
                .then(() => channel && challenge && postMessage("DictBot - e2e - end"))
                .then(()=> done());
        }
    );

    describe("S3 to DynamoDB Pipeline", function(){
        it("update lambda is triggered when a file is uploaded to s3; record is written to dynamodb", async () => {
            const Key = `dictbot-e2etest-0-${new Date().getTime()}.json`;
            const Body = await readFile("./test/assets/s3file.e2etest.0.json");
            const params = {
                Body,
                Bucket: DefinitionBucketName,
                Key
            };
            const upload = await s3.putObject(params).promise();
            expect(upload).to.have.property("ETag");
            context.s3.push({
                Bucket: DefinitionBucketName,
                Key
            });
            console.log("waiting to allow lambda to be invoked...");
            await delay(4000);
            const itemInDynamo = await term.get("e2etest");
            expect(R.path(["Item","Description","S"], itemInDynamo)).to.eql("0");
        });

        it("update lambda is triggered when a file is uploaded to s3; record is updated in dynamodb", async () => {
            const Key = `dictbot-e2etest-1-${new Date().getTime()}.json`;
            const Body = await readFile("./test/assets/s3file.e2etest.1.json");
            const params = {
                Body,
                Bucket: DefinitionBucketName,
                Key
            };
            const upload = await s3.putObject(params).promise();
            expect(upload).to.have.property("ETag");
            context.s3.push({
                Bucket: DefinitionBucketName,
                Key
            });
            console.log("waiting to allow lambda to be invoked...");
            await delay(2500);
            const itemInDynamo = await term.get("e2etest");
            context.dynamo.push("e2etest");
            expect(R.path(["Item","Description","S"], itemInDynamo)).to.eql("message test");
        });
    });

    describe("HTTP Endpoint", function(){
        it("Should reply with the correct status", async function(){
            // messageOptions :: String -> {}
            const messageOptions = text => ({
                method: "POST",
                body: {
                    token: challenge,
                    event: {
                        channel,
                        text
                    }
                },
                json: true
            });

            // challengeOptions :: {}
            const challengeOptions = {
                method: "POST",
                body: {
                    challenge: "some challenge",
                    token: "some token"
                },
                json: true
            };
            
            if(challenge){
                console.log("bot is verified, so can send messages");
                const response = await request.post(`${ServiceEndpoint}/dictionary`, messageOptions("search: e2etest"));
                const {message, messageSent:{ ok, message:{text}}} = response;
                expect(message).to.eql("200 OK");
                expect(ok).to.be.true;
                expect(text).to.eql("message test");
            }else{
                console.log("bot is not verified, so checking if can be challenged.\nyou should verify the app and add SLACK_CHALLENGE_TOKEN to your env");
                const response = await request.post(`${ServiceEndpoint}/dictionary`, challengeOptions);
                const {message} = response;
                expect(message).to.eql("Challenge token found and logged in cloudwatch. Use CHALLENGE TOKEN FOUND to filter.");
                expect(response).to.have.property("timestamp");
            }


        });
        it("Should reply Unauthorized if the authorization token is missing", async function(){
            // messageOptions :: String -> {}
            const messageOptions = text => ({
                method: "POST",
                body: {
                    event: {
                        channel,
                        text
                    }
                },
                json: true
            });

            try{
                await request.post(`${ServiceEndpoint}/dictionary`, messageOptions("search: e2etest"));
            }catch(error){
                expect(error.statusCode).to.eql(403);
                expect(error.message).to.eql("403 - {\"message\":\"Unauthorized\"}");
                expect(error.name).to.eql("StatusCodeError");
            } 
            
        });

        it("Should reply Unauthorized if the authorization token is wrong", async function(){
            // messageOptions :: String -> {}
            const messageOptions = text => ({
                method: "POST",
                body: {
                    token: "a wrong token",
                    event: {
                        channel,
                        text
                    }
                },
                json: true
            });

            try{
                await request.post(`${ServiceEndpoint}/dictionary`, messageOptions("search: e2etest"));
            }catch(error){
                expect(error.statusCode).to.eql(403);
                expect(error.message).to.eql("403 - {\"message\":\"Unauthorized\"}");
                expect(error.name).to.eql("StatusCodeError");
            } 
            
        });

    });
});