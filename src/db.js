import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update, remove, onValue, runTransaction } from "firebase/database";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const dbReady = !!(cfg.apiKey && cfg.databaseURL);
let db = null;
if (dbReady) db = getDatabase(initializeApp(cfg));

export async function sGet(path) {
  if (!db) return null;
  const s = await get(ref(db, path));
  return s.exists() ? s.val() : null;
}
export async function sSet(path, value) {
  if (!db) return false;
  await set(ref(db, path), value);
  return true;
}
export async function sUpdate(path, value) {
  if (!db) return false;
  await update(ref(db, path), value);
  return true;
}
export async function sDel(path) {
  if (!db) return true;
  await remove(ref(db, path));
  return true;
}
export function sTx(path, mutate) {
  if (!db) return Promise.resolve();
  return runTransaction(ref(db, path), (cur) => mutate(cur));
}
export function subscribe(path, cb) {
  if (!db) return () => {};
  return onValue(ref(db, path), (s) => cb(s.exists() ? s.val() : null));
}
export function subscribeConnected(cb) {
  if (!db) return () => {};
  return onValue(ref(db, ".info/connected"), (s) => cb(!!s.val()));
}
