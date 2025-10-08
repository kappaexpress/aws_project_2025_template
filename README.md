# AWS CDK 日記アプリケーション

このプロジェクトは、AWS CDK を使用して構築された日記アプリケーションです。AI（Amazon Bedrock）を使って日記の内容を自動生成し、DynamoDB に保存できます。

## 📁 ディレクトリ構成

```
aws_project_2025_template/
├── bin/                              # CDKアプリケーションのエントリーポイント
│   └── aws_project_2025_template.ts  # CDKアプリを初期化するファイル
│
├── lib/                              # インフラストラクチャのコード（IaC）
│   └── aws_project_2025_template-stack.ts  # AWSリソースを定義するメインファイル
│                                     # S3、Lambda、DynamoDBなどのリソースをここで作成
│
├── frontend/                         # Webアプリケーションのフロントエンド
│   ├── index.html                    # 日記入力フォームのHTMLファイル
│   ├── error.html                    # エラーページ
│   ├── app.js                        # フロントエンドのJavaScript（API呼び出しなど）
│   └── favicon.ico                   # ファビコン
│
├── lambda/                           # Lambda関数のコード
│   ├── echo/                         # サンプルのEcho関数
│   │   ├── echo.py                   # Echoのメイン処理
│   │   └── requirements.txt          # Python依存パッケージ
│   │
│   ├── save_to_dynamodb/             # DynamoDBにデータを保存する関数
│   │   ├── save_to_dynamodb.py       # データ保存のメイン処理
│   │   └── requirements.txt          # Python依存パッケージ
│   │
│   └── generate_diary_content/       # AIで日記の内容を生成する関数
│       ├── generate_diary_content.py # Bedrockを使った内容生成処理
│       └── requirements.txt          # Python依存パッケージ
│
├── test/                             # テストコード
│   └── aws_project_2025_template.test.ts  # CDKスタックのテスト
│
├── .gitignore                        # Gitで追跡しないファイルを指定
├── .npmignore                        # npmパッケージから除外するファイルを指定
├── cdk.json                          # CDKの設定ファイル
├── package.json                      # Node.jsプロジェクトの依存関係とスクリプト
├── tsconfig.json                     # TypeScriptの設定ファイル
├── jest.config.js                    # Jestテストフレームワークの設定
└── README.md                         # このファイル
```

## 🔍 各ディレクトリの詳細説明

### 📂 `bin/` - アプリケーションのエントリーポイント
- **役割**: CDK アプリケーションを起動する最初のファイルが入っています
- **解説**: CDK が最初に読み込むファイルです

### 📂 `lib/` - インフラストラクチャ定義
- **役割**: AWS のリソース（S3、Lambda、DynamoDB など）を TypeScript で定義します
- **解説**:
  - ここがプロジェクトの心臓部です
  - `aws_project_2025_template-stack.ts` を編集して、AWS リソースを追加・変更します
  - コードを書くだけで、実際の AWS リソースが作成されます（Infrastructure as Code）

### 📂 `frontend/` - ユーザーが見る画面
- **役割**: ブラウザで表示される HTML と JavaScript が入っています
- **解説**:
  - `index.html`: 日記を入力するフォーム画面
  - `app.js`: ボタンを押したときの動作（API 呼び出しなど）
  - このフォルダの内容は S3 バケットにアップロードされ、静的ウェブサイトとして公開されます

### 📂 `lambda/` - サーバーレス関数
- **役割**: AWS Lambda で実行される Python のコードが入っています
- **解説**:
  - 各サブディレクトリが 1 つの Lambda 関数に対応
  - `save_to_dynamodb/`: 日記を DynamoDB に保存する関数
  - `generate_diary_content/`: AI（Bedrock）で日記の内容を生成する関数
  - `requirements.txt`: その関数で使う Python ライブラリを指定

### 📂 `test/` - テストコード
- **役割**: インフラストラクチャが正しく定義されているかテストします
- **解説**: `npm test` でテストを実行できます

## 🚀 使い方

### 1. 依存関係のインストール
```bash
npm install
```

### 2. デプロイ（AWS にリソースを作成）
```bash
npx cdk deploy
```

### 3. デプロイ後の作業
デプロイが完了すると、以下の情報が表示されます：
- `WebsiteURL`: フロントエンドのURL
- `SaveToDynamoDBFunctionUrl`: データ保存APIのURL
- `GenerateDiaryFunctionUrl`: AI内容生成APIのURL

`frontend/app.js` の以下の部分を、表示されたURLに置き換えてください：
```javascript
const apiUrl = 'SaveToDynamoDBFunctionUrl';
const generateApiUrl = 'GenerateDiaryFunctionUrl';
```

再度デプロイして変更を反映：
```bash
npx cdk deploy
```

### 4. リソースの削除
```bash
npx cdk destroy
```

## 📚 主な AWS サービス

- **S3**: フロントエンドのホスティング
- **Lambda**: サーバーレス関数（Python）
- **DynamoDB**: データベース（NoSQL）
- **Bedrock**: AI サービス（日記の内容生成）
- **CDK**: インフラストラクチャをコードで管理

## 🎯 このプロジェクトで学べること

1. **Infrastructure as Code (IaC)**: コードでインフラを管理する方法
2. **サーバーレスアーキテクチャ**: サーバー管理不要で動くシステム
3. **AWS の基本サービス**: S3、Lambda、DynamoDB の使い方
4. **AI 統合**: Amazon Bedrock を使った生成 AI の活用

## 💡 よくある質問

**Q: `npx cdk deploy` で何が起こるの？**
A: `lib/` に書いたコードが実際の AWS リソースに変換され、自動的に作成されます。

**Q: Lambda 関数を追加するには？**
A: 1) `lambda/` に新しいフォルダを作成、2) Python コードを書く、3) `lib/aws_project_2025_template-stack.ts` で Lambda リソースを定義

**Q: フロントエンドを変更するには？**
A: `frontend/index.html` や `frontend/app.js` を編集して、`npx cdk deploy` で再デプロイ

