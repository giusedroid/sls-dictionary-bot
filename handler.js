const AWS = require("aws-sdk");
const R = require("ramda");
const Slack = require("slack");

const { series } = require("./lib/series");

const TABLE  = process.env.TABLE_NAME;
const BUCKET = process.env.BUCKET_NAME;
const TOKEN  = process.env.BOT_TOKEN;
const CHALLENGE_TOKEN = process.env.CHALLENGE_TOKEN;
const REGION = process.env.AWS_REGION || "eu-west-1";

AWS.config.update({ region: REGION });

const dynamo = new AWS.DynamoDB({ apiVersion: "2012-10-08"});
const term = require("./lib/term.model")(dynamo, TABLE);

const s3 = new AWS.S3({ apiVersion: "2006-03-01"});
const bucket = require("./lib/bucket.model")(s3, BUCKET);

const bot = new Slack( {token: TOKEN});

module.exports.dictionary = async (event) => {
    const body = JSON.parse(R.path(["body"], event));
    console.log("body", body);

    if( body && "challenge" in body && R.path(["token"], body) === CHALLENGE_TOKEN ){
        return {
            statusCode: 200,
            body: JSON.stringify({
                challenge: R.path(["challenge"], body)
            }),
        };
    }

    // one time only: use this to retrieve the challenge token
    if( body && "challenge" in body && !CHALLENGE_TOKEN){
        console.log(`CHALLENGE TOKEN FOUND: ${R.path(["token"], body)}`);
        return `Challenge token found and logged in cloudwatch ${new Date()}. Use CHALLENGE TOKEN FOUND to filter.`;
    }
    
    const { channel, bot_id, text } = R.path(["event"], body);
    
    // ingore messages form myself
    if ( bot_id === "BFVJD89U6") return "200 OK";

    const keyword = R.defaultTo("nope", R.path([1],text.split("search: ")));

    const reply = await term.get(keyword);

    console.log(reply);

    const messageSent = await bot.chat.postMessage({
        token: TOKEN,
        channel,
        text: R.defaultTo("Sorry, I didn't get that...", R.path(["Item", "Description", "S"], reply))
    });

    console.log("message sent:", messageSent);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "200 OK",
            messageSent
        })
    };

};

// updateF :: λ -> BucketModel -> λ -> λ* -> Promise
const updateF = (actions, bucket, series) => 
    async (event) => 
        Promise                                                             // Data Flow
            .resolve( bucket.itemsFromEvent(event) )                        // ['key', 'key', ... ]
            .then( keys => Promise.all(R.map(bucket.download, keys)))       // [Buffer, Buffer, ...]
            .then( R.map(bucket.decode) )                                   // [[def, def], [def], ...]
            .then( R.flatten )                                              // [def, def, def, ...]
            .then( R.map(actions) )                                         // [λ, λ, ... ]
            .then(series)                                                   // executes side effects
            .then( () => {
                console.log("done"); 
            });                                                

module.exports.testUpdateF = updateF;

// update :: AWSEvent -> Promise
module.exports.update = updateF(term.actionsFromDefinitions(term), bucket, series);