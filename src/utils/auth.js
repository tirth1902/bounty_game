export const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() || "admin";
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@123";

export function isAdminUser(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function getValidatedCurrentUser() {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  if (!currentUser) {
    return null;
  }

  if (currentUser.role === "admin") {
    return currentUser.username === ADMIN_USERNAME ? currentUser : null;
  }

  if (currentUser.role === "player") {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const matchedUser = users.find((user) => user.username === currentUser.username);

    if (matchedUser) {
      return {
        ...matchedUser,
        role: "player",
        balance: Number(matchedUser.balance ?? 1000),
      };
    }
  }

  return null;
}
