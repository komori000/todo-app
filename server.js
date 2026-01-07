/**
 * TODOアプリ - シンプルなNode.jsサーバー
 *
 * このサーバーは以下の機能を提供します：
 * - 静的ファイル（HTML/CSS/JS）の配信
 * - TODOデータのJSON保存・読み込み
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

// MIMEタイプの定義（ファイル種類に応じた適切なContent-Type）
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

// TODOデータを読み込む関数
function loadTodos() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
    }
    return [];
}

// TODOデータを保存する関数
function saveTodos(todos) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('データ保存エラー:', error);
        return false;
    }
}

// リクエストボディを読み取る関数
function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// HTTPサーバーの作成
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // CORS対応ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // プリフライトリクエスト対応
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // APIエンドポイント
    if (pathname === '/api/todos') {
        if (req.method === 'GET') {
            // TODO一覧を取得
            const todos = loadTodos();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(todos));
            return;
        }

        if (req.method === 'POST') {
            // 新しいTODOを追加
            try {
                const body = await readRequestBody(req);
                const todos = loadTodos();
                const newTodo = {
                    id: Date.now(),
                    text: body.text,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                todos.push(newTodo);
                saveTodos(todos);
                res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(newTodo));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '無効なリクエスト' }));
            }
            return;
        }
    }

    // 個別のTODO操作 (/api/todos/:id)
    const todoMatch = pathname.match(/^\/api\/todos\/(\d+)$/);
    if (todoMatch) {
        const todoId = parseInt(todoMatch[1]);
        const todos = loadTodos();
        const todoIndex = todos.findIndex(t => t.id === todoId);

        if (req.method === 'PUT') {
            // TODOを更新
            if (todoIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'TODOが見つかりません' }));
                return;
            }
            try {
                const body = await readRequestBody(req);
                todos[todoIndex] = { ...todos[todoIndex], ...body };
                saveTodos(todos);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(todos[todoIndex]));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '無効なリクエスト' }));
            }
            return;
        }

        if (req.method === 'DELETE') {
            // TODOを削除
            if (todoIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'TODOが見つかりません' }));
                return;
            }
            todos.splice(todoIndex, 1);
            saveTodos(todos);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            return;
        }
    }

    // 静的ファイルの配信
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, 'public', filePath);

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('ファイルが見つかりません');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('サーバーエラー');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 TODOアプリサーバーが起動しました`);
    console.log(`📍 http://localhost:${PORT} でアクセスできます`);
    console.log(`💾 データは todos.json に保存されます`);
    console.log(`\n終了するには Ctrl+C を押してください`);
});
