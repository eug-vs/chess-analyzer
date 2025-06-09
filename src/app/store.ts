import { createStore } from "@xstate/store";

const STORE_KEY = "store";

const initialSnapshot = localStorage.getItem(STORE_KEY);

export const store = createStore({
  context: initialSnapshot || {},
  on: {},
});

store.subscribe((snapshot) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
});
