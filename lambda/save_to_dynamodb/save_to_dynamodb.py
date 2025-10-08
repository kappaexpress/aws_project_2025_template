import json
import boto3
from datetime import datetime
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    try:
        # POSTリクエストのボディを取得
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}

        # date, title, contentを取得
        date = body.get('date')
        title = body.get('title')
        content = body.get('content')

        # バリデーション
        if not all([date, title, content]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                },
                'body': json.dumps({
                    'error': 'date, title, and content are required'
                })
            }

        # DynamoDBに保存
        timestamp = datetime.now().isoformat()
        item = {
            'id': f"{date}#{timestamp}",
            'date': date,
            'title': title,
            'content': content,
            'createdAt': timestamp
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'message': 'Data saved successfully',
                'item': item
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
