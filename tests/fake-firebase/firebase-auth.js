// Test stand-in for firebase-auth.js: anonymous sign-in gives a fake user.
// The fake database reads window.__FAKE_AUTH__.currentUser to apply the "auth != null" rules.
// Set window.__FAKE_AUTH_FAIL__ = n to make the first n sign-ins fail (like a phone without VPN).
const AUTH = window.__FAKE_AUTH__ || (window.__FAKE_AUTH__ = { currentUser: null, tries: 0 });
export const getAuth = () => AUTH;
export const signInAnonymously = async auth => {
  auth.tries++;
  if ((window.__FAKE_AUTH_FAIL__ || 0) >= auth.tries) { const e = new Error("auth/network-request-failed"); e.code = "auth/network-request-failed"; throw e; }
  auth.currentUser = { uid: "anon-" + Math.random().toString(36).slice(2, 10), isAnonymous: true };
  return { user: auth.currentUser };
};
export const onAuthStateChanged = (auth, cb) => { cb(auth.currentUser); return () => {}; };
