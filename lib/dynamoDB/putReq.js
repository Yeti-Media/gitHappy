var DOC = require("dynamodb-doc");
var dynamoDB = new DOC.DynamoDB();

module.exports = function putItem(tableName, item) {
  return dynamoDB
    .putItem({
      TableName: tableName,
      Item: item
    })
    .promise();
};
