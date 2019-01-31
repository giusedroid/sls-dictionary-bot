const R = require("ramda");

// download :: S3Client -> String -> String -> Promise(Buffer)
const download = (s3, Bucket) => Key => {
    const params = {
        Bucket,
        Key
    };
    return s3.getObject(params).promise();
};

// decode :: Buffer -> {}
const decode = buffer => JSON.parse(buffer.toString("utf-8"));

// itemsFromEvent :: AWSS3Event -> [ S3Bucket::Key ]
const itemsFromEvent = R.compose(
    R.pluck(["key"]),
    R.pluck(["object"]),
    R.pluck(["s3"]),
    R.path(["Records"])
);

module.exports = (s3, Bucket) => ({
    download: download(s3, Bucket),
    itemsFromEvent,
    decode
});