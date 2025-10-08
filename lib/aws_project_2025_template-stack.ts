// AWS CDKのコアライブラリをインポート
import * as cdk from 'aws-cdk-lib';
// CDKでリソースを構築するための基本クラスをインポート
import { Construct } from 'constructs';
// S3バケット関連の機能をインポート
import * as s3 from 'aws-cdk-lib/aws-s3';
// S3へのファイルデプロイ機能をインポート
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
// Lambda関数関連の機能をインポート
import * as lambda from 'aws-cdk-lib/aws-lambda';
// Python用のLambda関数を簡単に作成するためのライブラリをインポート
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
// DynamoDB(NoSQLデータベース)関連の機能をインポート
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// IAM(権限管理)関連の機能をインポート
import * as iam from 'aws-cdk-lib/aws-iam';
// ファイルパス操作用のNode.js標準ライブラリをインポート
import * as path from 'path';

// AWSリソースのスタック(まとまり)を定義するクラス
export class AwsProject2025TemplateStack extends cdk.Stack {
  // コンストラクタ: スタックを初期化する際に呼ばれる関数
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // 親クラス(cdk.Stack)のコンストラクタを呼び出し
    super(scope, id, props);

    // ========================================
    // S3バケット: 静的ウェブサイトをホスティング
    // ========================================
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      // ウェブサイトのトップページとして表示するファイル名
      websiteIndexDocument: 'index.html',
      // エラー時に表示するHTMLファイル名
      websiteErrorDocument: 'error.html',
      // インターネットから誰でも読み取り可能にする
      publicReadAccess: true,
      // ACL(アクセス制御リスト)のみブロックし、バケットポリシーは許可
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      // スタック削除時にバケットも削除する(本番環境では RETAIN を推奨)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // バケット削除時に中のオブジェクトも自動削除
      autoDeleteObjects: true,
    });

    // frontendフォルダのHTMLファイルをS3バケットにデプロイ
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      // デプロイ元: ローカルの./frontendフォルダ
      sources: [s3deploy.Source.asset('./frontend')],
      // デプロイ先: 上で作成したS3バケット
      destinationBucket: websiteBucket,
    });

    // S3ウェブサイトのURLをコンソールに出力(デプロイ後に確認できる)
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'S3 Website URL',
    });

    // ========================================
    // DynamoDB: データを保存するNoSQLデータベース
    // ========================================
    const dataTable = new dynamodb.Table(this, 'DataTable', {
      // パーティションキー(主キー): 各レコードを識別するためのユニークなID
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      // 課金モード: リクエスト数に応じた従量課金(小規模アプリに最適)
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // スタック削除時にテーブルも削除する(本番環境では RETAIN を推奨)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // Lambda関数①: DynamoDBにデータを保存する処理
    // ========================================
    const saveToDynamoDBFunction = new lambdaPython.PythonFunction(this, 'SaveToDynamoDBFunction', {
      // 実行環境: Python 3.13を使用
      runtime: lambda.Runtime.PYTHON_3_13,
      // エントリーポイントとなるPythonファイル名
      index: 'save_to_dynamodb.py',
      // Lambda関数内で呼び出される関数名
      handler: 'handler',
      // Lambda関数のソースコードがあるディレクトリ
      entry: path.join(__dirname, '../lambda/save_to_dynamodb'),
      // 環境変数: Lambda関数内で使用できる変数を設定
      environment: {
        TABLE_NAME: dataTable.tableName, // DynamoDBテーブル名を渡す
      },
    });

    // Lambda関数にDynamoDBテーブルへの書き込み権限を付与(IAMポリシー自動設定)
    dataTable.grantWriteData(saveToDynamoDBFunction);

    // Lambda関数を直接HTTPSでアクセスできるURLを作成
    const saveFunctionUrl = saveToDynamoDBFunction.addFunctionUrl({
      // 認証なしでアクセス可能(本番環境では認証を推奨)
      authType: lambda.FunctionUrlAuthType.NONE,
      // CORS設定: ブラウザから異なるドメインのAPIを呼び出せるようにする
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL], // すべてのHTTPメソッド(GET, POSTなど)を許可
        allowedOrigins: ["*"], // すべてのドメインからのアクセスを許可
        allowedHeaders: ["*"], // すべてのHTTPヘッダーを許可
      },
    });

    // Lambda Function URLをコンソールに出力(デプロイ後に確認できる)
    new cdk.CfnOutput(this, 'SaveToDynamoDBFunctionUrl', {
      value: saveFunctionUrl.url,
      description: 'Lambda Save to DynamoDB Function URL',
    });

    // DynamoDBテーブル名をコンソールに出力(デプロイ後に確認できる)
    new cdk.CfnOutput(this, 'TableName', {
      value: dataTable.tableName,
      description: 'DynamoDB Table Name',
    });

    // ========================================
    // Lambda関数②: Amazon BedrockでAI日記を生成する処理
    // ========================================
    const generateDiaryFunction = new lambdaPython.PythonFunction(this, 'GenerateDiaryContentFunction', {
      // 実行環境: Python 3.13を使用
      runtime: lambda.Runtime.PYTHON_3_13,
      // エントリーポイントとなるPythonファイル名
      index: 'generate_diary_content.py',
      // Lambda関数内で呼び出される関数名
      handler: 'handler',
      // Lambda関数のソースコードがあるディレクトリ
      entry: path.join(__dirname, '../lambda/generate_diary_content'),
      // タイムアウト: AI生成には時間がかかるため600秒(10分)に設定
      timeout: cdk.Duration.seconds(600),
    });

    // Lambda関数にAmazon Bedrock(生成AI)を呼び出す権限を付与
    generateDiaryFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW, // 許可する
      actions: ['bedrock:InvokeModel'], // BedrockのAIモデルを呼び出すアクション
      resources: ['*'], // すべてのBedrockモデルにアクセス可能
    }));

    // Lambda関数を直接HTTPSでアクセスできるURLを作成
    const generateDiaryFunctionUrl = generateDiaryFunction.addFunctionUrl({
      // 認証なしでアクセス可能(本番環境では認証を推奨)
      authType: lambda.FunctionUrlAuthType.NONE,
      // CORS設定: ブラウザから異なるドメインのAPIを呼び出せるようにする
      cors: {
        allowedMethods: [lambda.HttpMethod.ALL], // すべてのHTTPメソッド(GET, POSTなど)を許可
        allowedOrigins: ["*"], // すべてのドメインからのアクセスを許可
        allowedHeaders: ["*"], // すべてのHTTPヘッダーを許可
      },
    });

    // Lambda Function URLをコンソールに出力(デプロイ後に確認できる)
    new cdk.CfnOutput(this, 'GenerateDiaryFunctionUrl', {
      value: generateDiaryFunctionUrl.url,
      description: 'Lambda Generate Diary Content Function URL',
    });
  }
}
