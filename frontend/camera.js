// DOM要素の取得
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('capture');
const retakeBtn = document.getElementById('retake');
const uploadBtn = document.getElementById('upload');
const apiUrlInput = document.getElementById('apiUrl');
const statusDiv = document.getElementById('status');
const uploadHistory = document.getElementById('uploadHistory');
const historyList = document.getElementById('historyList');

// グローバル変数
let stream = null;
let capturedBlob = null;
let uploadHistoryData = [];

// ローカルストレージからAPI URLを読み込む
window.addEventListener('DOMContentLoaded', () => {
    const savedApiUrl = localStorage.getItem('presignedUrlApiUrl');
    if (savedApiUrl) {
        apiUrlInput.value = savedApiUrl;
    }

    // アップロード履歴を読み込む
    const savedHistory = localStorage.getItem('uploadHistory');
    if (savedHistory) {
        uploadHistoryData = JSON.parse(savedHistory);
        displayUploadHistory();
    }
});

// API URLの保存
apiUrlInput.addEventListener('change', () => {
    localStorage.setItem('presignedUrlApiUrl', apiUrlInput.value);
});

// カメラ起動
startCameraBtn.addEventListener('click', async () => {
    try {
        showStatus('カメラを起動しています...', 'info');

        // カメラストリームを取得（背面カメラを優先）
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // 背面カメラ
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        video.srcObject = stream;
        video.style.display = 'block';
        preview.style.display = 'none';
        captureBtn.disabled = false;
        retakeBtn.style.display = 'none';
        uploadBtn.disabled = true;

        showStatus('カメラが起動しました！撮影ボタンを押してください。', 'success');
    } catch (error) {
        console.error('カメラの起動に失敗:', error);
        showStatus('カメラの起動に失敗しました: ' + error.message, 'error');
    }
});

// 撮影
captureBtn.addEventListener('click', () => {
    try {
        // ビデオの状態をチェック
        if (!video.videoWidth || !video.videoHeight) {
            const errorDetails = {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                networkState: video.networkState,
                paused: video.paused,
                ended: video.ended
            };
            console.error('ビデオが準備できていません:', errorDetails);
            showStatus(
                `❌ ビデオが準備できていません\n` +
                `解像度: ${video.videoWidth}x${video.videoHeight}\n` +
                `ReadyState: ${video.readyState}\n` +
                `カメラを再起動してください。`,
                'error'
            );
            return;
        }

        // Canvasにビデオフレームを描画
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        console.log('Canvas設定:', {
            width: canvas.width,
            height: canvas.height,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
        });

        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2Dコンテキストの取得に失敗');
            showStatus('❌ Canvas 2Dコンテキストの取得に失敗しました。ブラウザが対応していない可能性があります。', 'error');
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('Canvas描画完了');

        // Canvasから画像をBlobとして取得
        canvas.toBlob((blob) => {
            if (!blob) {
                const errorDetails = {
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height,
                    contextType: typeof context
                };
                console.error('Blob生成に失敗:', errorDetails);
                showStatus(
                    `❌ 画像Blob生成に失敗しました\n` +
                    `Canvas: ${canvas.width}x${canvas.height}\n` +
                    `ブラウザのメモリ不足の可能性があります。`,
                    'error'
                );
                return;
            }

            console.log('Blob生成成功:', {
                size: blob.size,
                type: blob.type,
                sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
            });

            capturedBlob = blob;

            // プレビュー表示
            try {
                const url = URL.createObjectURL(blob);
                preview.src = url;
                preview.style.display = 'block';
                video.style.display = 'none';

                // カメラストリームを停止
                if (stream) {
                    stream.getTracks().forEach(track => {
                        console.log('トラック停止:', {
                            kind: track.kind,
                            label: track.label,
                            readyState: track.readyState
                        });
                        track.stop();
                    });
                }

                // ボタンの状態を更新
                captureBtn.disabled = true;
                retakeBtn.style.display = 'inline-block';
                uploadBtn.disabled = false;

                showStatus(
                    `✅ 撮影しました！\n` +
                    `サイズ: ${(blob.size / 1024).toFixed(2)} KB\n` +
                    `解像度: ${canvas.width}x${canvas.height}\n` +
                    `S3にアップロードできます。`,
                    'success'
                );
            } catch (previewError) {
                console.error('プレビュー表示エラー:', previewError);
                showStatus(
                    `⚠️ 撮影は成功しましたが、プレビュー表示に失敗しました\n` +
                    `エラー: ${previewError.message}\n` +
                    `アップロードは可能です。`,
                    'error'
                );
            }
        }, 'image/jpeg', 0.95);

    } catch (error) {
        const errorDetails = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            videoState: {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState
            },
            canvasState: {
                width: canvas.width,
                height: canvas.height
            }
        };
        console.error('撮影に失敗:', errorDetails);

        showStatus(
            `❌ 撮影に失敗しました\n` +
            `エラー種別: ${error.name}\n` +
            `詳細: ${error.message}\n` +
            `コンソールで詳細を確認してください。`,
            'error'
        );
    }
});

// 再撮影
retakeBtn.addEventListener('click', () => {
    capturedBlob = null;
    preview.style.display = 'none';
    retakeBtn.style.display = 'none';
    uploadBtn.disabled = true;
    startCameraBtn.click(); // カメラを再起動
});

// S3にアップロード
uploadBtn.addEventListener('click', async () => {
    if (!capturedBlob) {
        showStatus('画像が撮影されていません。', 'error');
        return;
    }

    const apiUrl = apiUrlInput.value.trim();
    if (!apiUrl) {
        showStatus('Lambda Function URLを入力してください。', 'error');
        return;
    }

    try {
        uploadBtn.disabled = true;
        showStatus('署名付きURLを取得しています...', 'info');

        // 1. 署名付きURLを取得
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_extension: 'jpg'
            })
        });

        if (!response.ok) {
            throw new Error(`API呼び出しエラー: ${response.status}`);
        }

        const data = await response.json();
        console.log('署名付きURL取得成功:', data);

        showStatus('S3に画像をアップロードしています...', 'info');

        // 2. 署名付きURLを使用してS3に画像をアップロード
        const uploadResponse = await fetch(data.upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/jpeg',
            },
            body: capturedBlob
        });

        if (!uploadResponse.ok) {
            throw new Error(`S3アップロードエラー: ${uploadResponse.status}`);
        }

        // 成功メッセージ
        showStatus(
            `✅ アップロード成功！\nバケット: ${data.bucket_name}\nキー: ${data.file_key}`,
            'success'
        );

        // アップロード履歴に追加
        addToHistory(data.bucket_name, data.file_key);

        // ボタンの状態をリセット
        uploadBtn.disabled = true;
        capturedBlob = null;

    } catch (error) {
        console.error('アップロードに失敗:', error);
        showStatus('アップロードに失敗しました: ' + error.message, 'error');
        uploadBtn.disabled = false;
    }
});

// ステータス表示
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';

    // 成功メッセージは5秒後に自動で消す
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// アップロード履歴に追加
function addToHistory(bucketName, fileKey) {
    const timestamp = new Date().toLocaleString('ja-JP');
    uploadHistoryData.unshift({
        timestamp,
        bucketName,
        fileKey
    });

    // 最大10件まで保存
    if (uploadHistoryData.length > 10) {
        uploadHistoryData = uploadHistoryData.slice(0, 10);
    }

    // ローカルストレージに保存
    localStorage.setItem('uploadHistory', JSON.stringify(uploadHistoryData));

    // 表示を更新
    displayUploadHistory();
}

// アップロード履歴を表示
function displayUploadHistory() {
    if (uploadHistoryData.length === 0) {
        uploadHistory.style.display = 'none';
        return;
    }

    uploadHistory.style.display = 'block';
    historyList.innerHTML = uploadHistoryData.map(item => `
        <div class="history-item">
            <strong>${item.timestamp}</strong><br>
            バケット: ${item.bucketName}<br>
            キー: ${item.fileKey}
        </div>
    `).join('');
}

// ページを離れる前にカメラを停止
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
