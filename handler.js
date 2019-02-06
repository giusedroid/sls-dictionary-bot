const AWS = require("aws-sdk");
const R = require("ramda");
const Slack = require("slack");

const { series } = require("./lib/series");

const TABLE  = process.env.TABLE_NAME;
const BUCKET = process.env.BUCKET_NAME;
const TOKEN  = process.env.BOT_TOKEN;
const CHALLENGE_TOKEN = process.env.CHALLENGE_TOKEN;
const REGION = R.defaultTo("eu-west-1", process.env.AWS_REGION);

AWS.config.update({ region: REGION });

// dynamo :: DynamoDB Client
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-10-08" });
// term :: Model Term
const term = require("./lib/term.model")(dynamo, TABLE);

// s3 :: S3 Client
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
// bucket :: Model Bucket
const bucket = require("./lib/bucket.model")(s3, BUCKET);

// bot :: Slack Bot
const bot = new Slack( {token: TOKEN});

// dictionaryF --------------------------------------------------------------------------
// this higher order function generates the handler for the update lambda
// when specialized with term, CHALLENGE_TOKEN, and bot.
// this is done to allow dependency injection and, in general
// to ease testing.
//
// dictionaryF :: Model Term -> String -> Slack Bot -> AWS Event -> HTTP Response
const dictionaryF = (term, CHALLENGE_TOKEN, bot) => async (event) => {
    const body = JSON.parse(R.path(["body"], event));

    if( body && "challenge" in body && R.path(["token"], body) === CHALLENGE_TOKEN ){
        return {
            statusCode: 200,
            body: JSON.stringify({
                challenge: R.path(["challenge"], body)
            })
        };
    }

    // one time only: use this to retrieve the challenge token
    if( body && "challenge" in body && !CHALLENGE_TOKEN){
        console.log(`CHALLENGE TOKEN FOUND: ${R.path(["token"], body)}`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Challenge token found and logged in cloudwatch. Use CHALLENGE TOKEN FOUND to filter.",
                timestamp: new Date()
            })
        };
    }
    
    const { channel, bot_id, text } = R.defaultTo({}, R.path(["event"], body));
    
    // ingore messages form other bots (and myself)
    if ( bot_id ) return "200 OK";

    const keyword = R.defaultTo("NOK", R.path([1], text.split("search: ")));

    let reply;
    if( keyword !== "NOK")
        reply = await term.get(keyword);

    const messageSent = await bot.chat.postMessage({
        token: TOKEN,
        channel,
        text: R.defaultTo(
            "Sorry, I didn't get that...",
            R.path(["Item", "Description", "S"], reply)
        )
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "200 OK",
            messageSent
        })
    };

};


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
module.exports.update = updateF(term.actionsFromDefinitions(term), bucket, series);

// dictionary ---------------------------------------------------------------------------
// this is the handler for the dictionary lambda
// it's a specialized version of dictionaryF
//
// dictionary :: AWS Event -> Promise
module.exports.dictionary = dictionaryF(term, CHALLENGE_TOKEN, bot);

// exports for testing purposes 
module.exports.testUpdateF = updateF;
module.exports.testDictionaryF = dictionaryF;