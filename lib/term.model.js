
// get :: DynamoDB -> DynamoDBTable -> String -> Promise
const get = (dynamo, table) => term => {
    const params = {
        TableName: table,
        Key: {
            Term: {
                S: term
            }
        }
    };
    
    return dynamo.getItem(params).promise();
};

// upsert :: DynamoDB -> DynamoDBTable -> String -> String -> Promise
const upsert = (dynamo, table) => (term, description) => {
    const params = {
        TableName: table,
        Item: {
            Term: {
                S: term
            },
            Description: {
                S: description
            }
        }
    };
    return dynamo.putItem(params).promise();
};

// del :: DynamoDB -> DynamoDBTable -> String -> Promise
const del = (dynamo, table) => term => {
    const params = {
        TableName: table,
        Key: {
            Term: {
                S: term
            }
        }
    };

    return dynamo.deleteItem(params).promise();
    
};

// actionsFromDefinitions :: TermModel -> Definition -> λ -> Promise
const actionsFromDefinitions = term => def => () => term[def.action || "create"](def.term, def.definition);

// exports :: DynamoDB -> DynamoDBTable -> Module
module.exports = (dynamo, table) => ({
    create: upsert(dynamo, table),
    update: upsert(dynamo, table),
    delete: del(dynamo, table),
    get: get(dynamo, table),
    actionsFromDefinitions
});