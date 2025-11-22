'use client';

import { useState } from 'react';
import { useTodoContext } from '../state/TodoContext';
import { z } from 'zod';

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const TodoList = () => {
  const todos = useTodoContext();
  const [items, setItems] = useState<Todo[]>(todos.items);

  // keep local state in sync with global
  if (items !== todos.items) {
    // cheap sync during render when external changes occur
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setItems(todos.items);
  }

  const [newTitle, setNewTitle] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const TitleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Keep it under 200 characters');

  const addRootTodo = () => {
    const parsed = TitleSchema.safeParse(newTitle);
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? 'Invalid title');
      return;
    }
    const title = parsed.data;
    todos.addMany([title]);
    setItems(todos.items);
    setNewTitle('');
    setAddError(null);
  };

  return (
    <div className="todos">
      <div className="todo-add">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a to-do..."
          aria-label="Add to-do"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addRootTodo();
          }}
        />
        <button type="button" onClick={addRootTodo} aria-label="Add to-do" className="icon-btn primary">
          <span aria-hidden>＋</span>
        </button>
      </div>
      {addError && <div className="error-text" role="status">{addError}</div>}

      <div className="todo-list-scroll">
        <ul className="todo-list-root">
          {items.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={() => { todos.markByTitle(t.title, !t.done); setItems(todos.items); }}
              onRename={(title) => { todos.renameByTitle(t.title, title); setItems(todos.items); }}
              onDelete={() => { todos.removeByTitle(t.title); setItems(todos.items); }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
const TodoItem = ({
  todo,
  onToggle,
  onRename,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);

  const TitleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Keep it under 200 characters');

  const saveTitle = () => {
    const parsed = TitleSchema.safeParse(title);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid title');
      return;
    }
    onRename(parsed.data);
    setEditing(false);
    setError(null);
  };

  return (
    <li className="todo-item">
      <div className="todo-row">
        <input type="checkbox" checked={todo.done} onChange={onToggle} aria-label="Toggle done" />
        {editing ? (
          <input
            className="todo-edit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setTitle(todo.title);
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span className={`todo-title ${todo.done ? 'done' : ''}`} onDoubleClick={() => setEditing(true)}>
            {todo.title}
          </span>
        )}
        <div className="todo-actions">
          <button type="button" onClick={() => setEditing((v) => !v)} aria-label="Edit" className="icon-btn">
            <span aria-hidden>✏️</span>
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete" className="icon-btn">
            <span aria-hidden>🗑️</span>
          </button>
        </div>
      </div>
      {error && <div className="error-text" role="status">{error}</div>}
    </li>
  );
};

export default TodoList;
