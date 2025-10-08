import json
from datetime import datetime

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    # POSTリクエストのボディを取得
    body = json.loads(event.get('body', '{}')) if event.get('body') else {}

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps({
            'message': 'Echo response',
            'received': body,
            'timestamp': datetime.isoformat()
        })
    }
