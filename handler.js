const message = 'Hello from serverless';
module.exports.message = message;

module.exports.hello = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
      event,
    }),
  };
};
