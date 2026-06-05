import { Link, useNavigate } from "react-router-dom";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() || "admin";

function Register() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    const cpassword = e.target["c-password"].value;
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (!username || !password || !cpassword) {
      alert("All fields required");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== cpassword) {
      alert("Password Not Match");
      return;
    }

    if (username.toLowerCase() === ADMIN_USERNAME) {
      alert("Invalid username. Please choose a different username.");
      return;
    }

    const alreadyExists = users.some((user) => user.username === username);

    if (alreadyExists) {
      alert("Username already exists. Please use a different username.");
      return;
    }

    users.push({ username, password, role: "player", balance: 1000 });
    localStorage.setItem("users", JSON.stringify(users));

    navigate("/login", { replace: true });
  }
  return (
    <div className="Login">
      <h2>Register for an Account</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" />
        <br />

        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" />
        <br />

        <label htmlFor="c-password">Confirm Password:</label>
        <input type="password" id="c-password" name="c-password" />

        <div className="login-button">
          <button type="submit">Register</button>
        </div>

        <p className="register">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
