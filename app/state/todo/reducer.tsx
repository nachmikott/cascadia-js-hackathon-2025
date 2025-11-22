import type { Todo } from '../TodoContext';
import type { TodoAction } from './actions';

const uid = () => Math.random().toString(36).slice(2,10);

export const initialTodoState: Todo[] = [];

export const todoReducer = (state: Todo[], action: TodoAction): Todo[] => {
  switch (action.type) {
    case 'addMany':
      return [
        ...state,
        ...action.titles.filter(t => t && t.trim()).map(t => ({ id: uid(), title: t.trim(), done: false }))
      ];
    case 'markByTitle':
      return state.map(it => it.title === action.title ? { ...it, done: action.done } : it);
    case 'renameByTitle':
      return state.map(it => it.title === action.oldTitle ? { ...it, title: action.newTitle } : it);
    case 'removeByTitle':
      return state.filter(it => it.title !== action.title);
    case 'setAll':
      return [...action.items];
    default:
      return state;
  }
};
