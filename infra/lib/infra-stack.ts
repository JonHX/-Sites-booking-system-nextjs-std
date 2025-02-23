import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import path = require("path");

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.AWS_ACCOUNT_ID || "149227782495",
        region: process.env.AWS_REGION || "eu-west-1",
      },
      ...props,
    });

    const table = new dynamodb.Table(this, "BookingsTable", {
      tableName: "bookings-table",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
    });

    const api = new appsync.GraphqlApi(this, "BookingsAPI", {
      name: "bookings-api",
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, '..', '..', 'graphql', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: { expires: cdk.Expiration.after(cdk.Duration.days(365)) },
        },
      },
    });

    const dataSource = api.addDynamoDbDataSource("DynamoDataSource", table);

    dataSource.createResolver("GetBookingResolver", {
      typeName: "Query",
      fieldName: "getBooking",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem("pk", "sk"),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphQLAPIKey", { value: api.apiKey || "" });
    new cdk.CfnOutput(this, "DynamoDBTableName", { value: table.tableName });
  }
}
