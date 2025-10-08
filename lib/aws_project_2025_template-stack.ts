import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class AwsProject2025TemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットを作成（静的ウェブサイトホスティング有効化）
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // HTMLファイルをS3にデプロイ
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./frontend')],
      destinationBucket: websiteBucket,
    });

    // S3ウェブサイトURLを出力
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'S3 Website URL',
    });

    // DynamoDBテーブルを作成
    const dataTable = new dynamodb.Table(this, 'DataTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda関数を作成（DynamoDB保存機能）
    const saveToDynamoDBFunction = new lambdaPython.PythonFunction(this, 'SaveToDynamoDBFunction', {
      runtime: lambda.Runtime.PYTHON_3_13,
      index: 'save_to_dynamodb.py',
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/save_to_dynamodb'),
      environment: {
        TABLE_NAME: dataTable.tableName,
      },
    });

    // Lambda関数にDynamoDBテーブルへの書き込み権限を付与
    dataTable.grantWriteData(saveToDynamoDBFunction);

    // Lambda Function URLを作成
    const saveFunctionUrl = saveToDynamoDBFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
      },
    });

    // Lambda Function URLを出力
    new cdk.CfnOutput(this, 'SaveToDynamoDBFunctionUrl', {
      value: saveFunctionUrl.url,
      description: 'Lambda Save to DynamoDB Function URL',
    });

    // DynamoDBテーブル名を出力
    new cdk.CfnOutput(this, 'TableName', {
      value: dataTable.tableName,
      description: 'DynamoDB Table Name',
    });

    // Lambda関数を作成（Bedrock日記生成機能）
    const generateDiaryFunction = new lambdaPython.PythonFunction(this, 'GenerateDiaryContentFunction', {
      runtime: lambda.Runtime.PYTHON_3_13,
      index: 'generate_diary_content.py',
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/generate_diary_content'),
      timeout: cdk.Duration.seconds(600),
    });

    // Lambda関数にBedrockアクセス権限を付与
    generateDiaryFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    // Lambda Function URLを作成
    const generateDiaryFunctionUrl = generateDiaryFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
      },
    });

    // Lambda Function URLを出力
    new cdk.CfnOutput(this, 'GenerateDiaryFunctionUrl', {
      value: generateDiaryFunctionUrl.url,
      description: 'Lambda Generate Diary Content Function URL',
    });
  }
}
