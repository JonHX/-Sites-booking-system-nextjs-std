import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

describe('InfraStack', () => {
  const app = new cdk.App();
  const stack = new InfraStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  test('DynamoDB Table Created', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'bookings-table',
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });
  });

  test('AppSync API Created', () => {
    template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
      Name: 'bookings-api',
      AuthenticationType: 'API_KEY'
    });
  });

  test('AppSync DataSource Created', () => {
    template.hasResourceProperties('AWS::AppSync::DataSource', {
      Type: 'AMAZON_DYNAMODB'
    });
  });

  test('AppSync Resolver Created', () => {
    template.hasResourceProperties('AWS::AppSync::Resolver', {
      TypeName: 'Query',
      FieldName: 'getBooking'
    });
  });

  test('Stack Outputs Created', () => {
    template.hasOutput('GraphQLAPIURL', {});
    template.hasOutput('GraphQLAPIKey', {});
    template.hasOutput('DynamoDBTableName', {});
  });
});