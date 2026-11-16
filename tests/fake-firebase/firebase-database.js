// Test stand-in for firebase-database.js: an in-memory Realtime Database that enforces
// the SAME rules as the live project (CLAUDE.md rule 2, with voices/ added for the speaking corner):
//   {"rules":{"squad":{".read":"auth != null","$section":{"$key":{".write":"auth != null"}}},
//             "voices":{"$week":{".read":"auth != null",".write":"auth != null && !newData.exists()",
//                                "$member":{"$clip":{".write":"auth != null"}}}}}}
// i.e. nothing without a signed-in user (fake auth in firebase-auth.js); read squad/ and voices/<week>/…;
// write only at squad/<section>/<key> or deeper, voices/<week>/<member>/<clip> or deeper,
// or delete a whole voices/<week>. ".info/..." needs no sign-in, like the real one.
// Every refused read or write is recorded in window.__DENIED__ so tests can fail on it.
const DB = window.__FAKE_DB__ || (window.__FAKE_DB__ = {});
const subs = [];
const parts = p => p.split("/").filter(Boolean);
const getAt = p => parts(p).reduce((o, k) => (o == null ? undefined : o[k]), DB);
const clean = v => JSON.parse(JSON.stringify(v, (k, x) => (x && x[".sv"] ? Date.now() : x)));
function setAt(p, v) {
  const ps = parts(p); let o = DB;
  ps.slice(0, -1).forEach(k => { if (typeof o[k] !== "object" || o[k] == null) o[k] = {}; o = o[k]; });
  if (v === null || v === undefined) delete o[ps.at(-1)]; else o[ps.at(-1)] = clean(v);
}
const signedIn = () => !!(window.__FAKE_AUTH__ && window.__FAKE_AUTH__.currentUser);
const allowed = (p, v) => {
  const ps = parts(p); if (!signedIn()) return false;
  if (ps[0] === "squad") return ps.length >= 3;
  if (ps[0] === "voices") return ps.length >= 4 || (ps.length === 2 && v == null);
  return false;
};
const readable = p => p.startsWith(".info/") || (signedIn() && (parts(p)[0] === "squad" || (parts(p)[0] === "voices" && parts(p).length >= 2)));
const denial = p => { (window.__DENIED__ ||= []).push(p); const e = new Error("PERMISSION_DENIED: Permission denied"); e.code = "PERMISSION_DENIED"; return e; };
const deny = p => Promise.reject(denial(p));
const fire = () => setTimeout(() => subs.forEach(([p, cb]) => cb({ val: () => (p === ".info/serverTimeOffset" ? 0 : clean(getAt(p) ?? null)) })), 0);
export const getDatabase = () => ({});
export const ref = (db, path) => ({ path: path || "" });
// like the real SDK: a refused read calls the cancel callback once and the listener is dropped
export const onValue = (r, cb, cancel) => {
  if (!readable(r.path)) { const e = denial("read " + r.path); setTimeout(() => cancel && cancel(e), 0); return () => {}; }
  subs.push([r.path, cb]); fire(); return () => {};
};
export const set = async (r, v) => { if (!allowed(r.path, v)) return deny(r.path); setAt(r.path, v); fire(); };
// a multi-path update is checked path by path, like the real rules
export const update = async (r, obj) => {
  for (const [k, v] of Object.entries(obj)) if (!allowed(r.path + "/" + k, v)) return deny(r.path + "/" + k);
  for (const [k, v] of Object.entries(obj)) setAt(r.path + "/" + k, v); fire();
};
export const push = async (r, v) => { const key = "k" + Date.now() + Math.random().toString(36).slice(2, 6); await set({ path: r.path + "/" + key }, v); return { key }; };
export const remove = r => set(r, null);
export const runTransaction = async (r, fn) => {
  if (!allowed(r.path)) return deny(r.path);
  const cur = getAt(r.path), nv = fn(cur === undefined ? null : clean(cur));
  if (nv === undefined) return { committed: false };
  setAt(r.path, nv); fire(); return { committed: true, snapshot: { val: () => nv } };
};
export const get = async r => { if (!readable(r.path)) return deny("read " + r.path); (window.__READS__ ||= []).push(r.path); const v = clean(getAt(r.path) ?? null); return { val: () => v, exists: () => v != null }; };
export const serverTimestamp = () => ({ ".sv": "timestamp" });
export const onDisconnect = () => ({ remove: () => Promise.resolve(), set: () => Promise.resolve() });
