import { Link, useNavigate } from "react-router-dom";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() || "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@123";

function Login() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (!username || !password) {
      alert("All fields required");
      return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({ username, role: "admin" }),
      );
      navigate("/admin", { replace: true });
      return;
    }

    const matchedUser = users.find(
      (user) => user.username === username && user.password === password,
    );

    if (!matchedUser) {
      alert("Invalid username or password");
      return;
    }

    const currentUser = {
      ...matchedUser,
      role: "player",
      balance: Number(matchedUser.balance ?? 1000),
    };

    const updatedUsers = users.map((user) =>
      user.username === matchedUser.username
        ? { ...user, balance: Number(matchedUser.balance ?? 1000) }
        : user,
    );

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    navigate("/player", { replace: true });
  }

  return (
    <div className="Login">
      <h2>Login to Your Account</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" />
        <br />

        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" />
        <br />
        <div className="login-button">
          <button type="submit">Login</button>
        </div>
        <p className="register">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
