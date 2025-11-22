import type { Todo } from '../TodoContext';

export type TodoAction =
  | { type: 'addMany'; titles: string[] }
  | { type: 'markByTitle'; title: string; done: boolean }
  | { type: 'renameByTitle'; oldTitle: string; newTitle: string }
  | { type: 'removeByTitle'; title: string }
  | { type: 'setAll'; items: Todo[] };

export const addMany = (titles: string[]): TodoAction => ({ type: 'addMany', titles });
export const markByTitle = (title: string, done: boolean): TodoAction => ({ type: 'markByTitle', title, done });
export const renameByTitle = (oldTitle: string, newTitle: string): TodoAction => ({ type: 'renameByTitle', oldTitle, newTitle });
export const removeByTitle = (title: string): TodoAction => ({ type: 'removeByTitle', title });
export const setAll = (items: Todo[]): TodoAction => ({ type: 'setAll', items });
