import json
import boto3

bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-east-1")
modelId = "anthropic.claude-3-5-haiku-20241022-v1:0"


def handler(event, context):
    """
    日記のタイトルを受け取り、Bedrockで内容を生成して返す
    """
    try:
        # リクエストボディを解析
        body = json.loads(event.get("body", "{}"))
        title = body.get("title", "")

        if not title:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({"error": "タイトルが必要です"}),
            }

        # Bedrockにリクエスト
        prompt = f"""以下の日記のタイトルに基づいて、適切な日記の内容を日本語で生成してください。自然で心のこもった内容にしてください。タイトル: {title}日記の内容:"""

        messages = [{"role": "user", "content": [{"text": prompt}]}]

        response = bedrock_runtime.converse(modelId=modelId, messages=messages)

        # レスポンスを解析
        generated_content = response["output"]["message"]["content"][0]["text"]

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": json.dumps(
                {"title": title, "content": generated_content}, ensure_ascii=False
            ),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }
