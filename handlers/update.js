const AWS = require("aws-sdk");
const R = require("ramda");

const { series } = require("../lib/series");

const TABLE  = process.env.TABLE_NAME;
const BUCKET = process.env.BUCKET_NAME;
const REGION = R.defaultTo("eu-west-1", process.env.AWS_REGION);

AWS.config.update({ region: REGION });

// dynamo :: DynamoDB Client
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-10-08" });
// term :: Model Term
const term = require("../lib/term.model")(dynamo, TABLE);

// s3 :: S3 Client
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
// bucket :: Model Bucket
const bucket = require("../lib/bucket.model")(s3, BUCKET);

// updateF ---------------------------------------------------------------------------
// this higher order function generates the handler for the update lambda
// when specialized with actionMapper, bucket and series
// this is done to allow dependency injection and, in general
// to ease testing.
//
// updateF :: Function -> Model Bucket -> Function -> AWS Event -> Promise
const updateF = (actionMapper, bucket, series) => 
    async (event) => 
        Promise                                                             // Data Flow :
            .resolve( bucket.itemsFromEvent(event) )                        // ['key', 'key', ... ]
            .then( keys => Promise.all(R.map(bucket.download, keys)))       // [Buffer, Buffer, ...]
            .then( R.map(bucket.decode) )                                   // [[def, def], [def], ...]
            .then( R.flatten )                                              // [def, def, def, ...]
            .then( R.map(actionMapper) )                                    // [λ, λ, ... ]
            .then(series);                                                  // executes side effects                                   

// update -------------------------------------------------------------------------------
// this is the handler for the update lambda
// it's a specialized version of updateF
// update :: AWS Event -> Promise
module.exports.handler = updateF(term.actionsFromDefinitions(term), bucket, series);

// exports for testing purposes 
module.exports.testUpdateF = updateF;