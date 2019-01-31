const AWS = require("aws-sdk");
const R = require("ramda");

const { series } = require("./lib/series");

const TABLE  = process.env.TABLE_NAME;
const BUCKET = process.env.BUCKET_NAME;
// const TOKEN  = process.env.BOT_TOKEN;
const REGION = process.env.AWS_REGION || "eu-west-1";

AWS.config.update({ region: REGION });

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-10-08"});
const term = require("./lib/term.model")(dynamo, TABLE);

const s3 = new AWS.S3({ apiVersion: "2006-03-01"});
const bucket = require("./lib/bucket.model")(s3, BUCKET);

const message = "Hello from serverless";

module.exports.dictionary = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message,
            event,
        }),
    };
};

const updateF = (actions, bucket, series) => async (event) => Promise
    .resolve( bucket.itemsFromEvent(event) )                         // ['key', 'key', ... ]
    .then( keys => Promise.all(R.map(bucket.download, keys)))        // [Buffer, Buffer, ...]
    .then( R.map(bucket.decode) )                                    // [[def, def], [def], ...]
    .then( R.flatten )                                               // [def, def, def, ...]
    .then( R.map(actions))                                           // [λ, λ, ... ]
    .then( series );                                                 // executes side effects

module.exports.testUpdateF = updateF;
module.exports.update = updateF(term.actionsFromDefinitions(term), bucket, series);