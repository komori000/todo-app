/**
 * TODOアプリ - フロントエンドJavaScript（ローカルストレージ版）
 */

// DOM要素の取得
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// 状態管理
let todos = [];
let currentFilter = 'all';

// ローカルストレージのキー
const STORAGE_KEY = 'todos';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    // フォーム送信
    todoForm.addEventListener('submit', handleSubmit);

    // フィルターボタン
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // 完了済み削除ボタン
    clearCompletedBtn.addEventListener('click', clearCompleted);
}

// TODOを読み込む（ローカルストレージから）
function loadTodos() {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : [];
    renderTodos();
}

// TODOを保存（ローカルストレージへ）
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 新しいTODOを追加
function handleSubmit(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    saveTodos();
    todoInput.value = '';
    renderTodos();
}

// TODOの完了状態を切り替え
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
}

// TODOを削除
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// 完了済みを一括削除
function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
}

// TODOリストを描画
function renderTodos() {
    // フィルタリング
    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }

    // リストをクリア
    todoList.innerHTML = '';

    // 空の場合
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li class="empty-message">タスクがありません</li>';
    } else {
        // TODOアイテムを追加
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${todo.id})"
                >
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="todo-delete" onclick="deleteTodo(${todo.id})">削除</button>
            `;
            todoList.appendChild(li);
        });
    }

    // カウント更新
    const activeCount = todos.filter(t => !t.completed).length;
    todoCount.textContent = `${activeCount}件の未完了タスク`;
}

// HTMLエスケープ（XSS対策）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
