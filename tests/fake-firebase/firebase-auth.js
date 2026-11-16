// Test stand-in for firebase-auth.js: anonymous sign-in gives a fake user.
// The fake database reads window.__FAKE_AUTH__.currentUser to apply the "auth != null" rules.
// Set window.__FAKE_AUTH_FAIL__ = n to make the first n sign-ins fail (like a phone without VPN);
// window.__FAKE_AUTH_CODE__ picks the error code (default auth/network-request-failed).
const AUTH = window.__FAKE_AUTH__ || (window.__FAKE_AUTH__ = { currentUser: null, tries: 0 });
export const getAuth = () => AUTH;
export const signInAnonymously = async auth => {
  auth.tries++;
  if ((window.__FAKE_AUTH_FAIL__ || 0) >= auth.tries) { const c = window.__FAKE_AUTH_CODE__ || "auth/network-request-failed", e = new Error(c); e.code = c; throw e; }
  auth.currentUser = { uid: "anon-" + Math.random().toString(36).slice(2, 10), isAnonymous: true };
  return { user: auth.currentUser };
};
export const onAuthStateChanged = (auth, cb) => { cb(auth.currentUser); return () => {}; };
