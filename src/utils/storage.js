export function readStorage(key, defaultValue = null) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}

export function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}

export function clearCurrentUser() {
  sessionStorage.removeItem("currentUser");
}

export function getUsers() {
  return readStorage("users", []);
}

export function setUsers(users) {
  writeStorage("users", users);
}
