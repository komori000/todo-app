/**
 * TODOアプリ - フロントエンドJavaScript
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

// APIベースURL
const API_URL = '/api/todos';

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

// TODOを読み込む
async function loadTodos() {
    try {
        const response = await fetch(API_URL);
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('読み込みエラー:', error);
    }
}

// 新しいTODOを追加
async function handleSubmit(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const newTodo = await response.json();
        todos.push(newTodo);
        todoInput.value = '';
        renderTodos();
    } catch (error) {
        console.error('追加エラー:', error);
    }
}

// TODOの完了状態を切り替え
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !todo.completed })
        });
        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === id);
        todos[index] = updatedTodo;
        renderTodos();
    } catch (error) {
        console.error('更新エラー:', error);
    }
}

// TODOを削除
async function deleteTodo(id) {
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        todos = todos.filter(t => t.id !== id);
        renderTodos();
    } catch (error) {
        console.error('削除エラー:', error);
    }
}

// 完了済みを一括削除
async function clearCompleted() {
    const completedTodos = todos.filter(t => t.completed);
    for (const todo of completedTodos) {
        await deleteTodo(todo.id);
    }
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
