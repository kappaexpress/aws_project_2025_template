// TODO: デプロイ後に実際のURLに置き換える
const apiUrl = 'https://ux5c7tl5yuqwshn4usno6pjb4a0aazpw.lambda-url.ap-northeast-1.on.aws/';
// TODO: デプロイ後に実際のURLに置き換える
const generateApiUrl = 'https://nff25zccypvvc4zhhpffh4fsjy0ztqrb.lambda-url.ap-northeast-1.on.aws/';

// AI で内容を生成ボタンのイベントリスナー
document.getElementById('generateContentBtn').addEventListener('click', async function () {
    const title = document.getElementById('title').value.trim();

    // タイトルが入力されているかチェック
    if (!title) {
        document.getElementById('result').innerHTML =
            '<div class="alert alert-warning">タイトルを入力してください。</div>';
        return;
    }

    // ボタンを無効化してローディング表示
    const btn = this;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
        const response = await fetch(generateApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: title })
        });

        const result = await response.json();

        if (response.ok) {
            // 生成された内容をテキストエリアに設定
            document.getElementById('content').value = result.content;
            document.getElementById('result').innerHTML =
                '<div class="alert alert-success">内容を生成しました!</div>';
        } else {
            document.getElementById('result').innerHTML =
                '<div class="alert alert-danger">エラー: ' + (result.error || '内容の生成に失敗しました') + '</div>';
        }
    } catch (error) {
        document.getElementById('result').innerHTML =
            '<div class="alert alert-danger">エラー: ' + error.message + '</div>';
    } finally {
        // ボタンを元に戻す
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

document.getElementById('dataForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    const data = {
        date: date,
        title: title,
        content: content
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('result').innerHTML =
                '<div class="alert alert-success">データが正常に保存されました!</div>';
            // フォームをリセット
            document.getElementById('dataForm').reset();
            document.getElementById('date').valueAsDate = new Date();
        } else {
            document.getElementById('result').innerHTML =
                '<div class="alert alert-danger">エラー: ' + (result.error || 'データの保存に失敗しました') + '</div>';
        }
    } catch (error) {
        document.getElementById('result').innerHTML =
            '<div class="alert alert-danger">エラー: ' + error.message + '</div>';
    }
});
