import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import * as path from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "CarRentalTable", {
      tableName: "car-rental-table",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
    });
    
    // user gsi
    table.addGlobalSecondaryIndex({
      indexName: "UserLookup",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL, 
    });

    const api = new appsync.GraphqlApi(this, "BookingsAPI", {
      name: "bookings-api",
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, "..", "..", "graphql/schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: { expires: cdk.Expiration.after(cdk.Duration.days(365)) },
        },
      },
    });

    const dataSource = api.addDynamoDbDataSource("DynamoDataSource", table);

    dataSource.createResolver("AddBookingResolver", {
      typeName: "Mutation",
      fieldName: "addBooking",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(path.join(__dirname, "addBooking-request.vtl")),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(path.join(__dirname, "addBooking-response.vtl")),
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphQLAPIKey", { value: api.apiKey || "" });
    new cdk.CfnOutput(this, "DynamoDBTableName", { value: table.tableName });
  }
}