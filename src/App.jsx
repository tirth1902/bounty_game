import "./style.css";
import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import PlayerDashboard from "./pages/PlayerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Register from "./pages/Register.jsx";
import Users from "./pages/Users.jsx";
import Rounds from "./pages/Rounds.jsx";
import { getValidatedCurrentUser } from "./utils/auth.js";

function App() {
  const [currentUser, setCurrentUser] = useState(() =>
    getValidatedCurrentUser(),
  );

  const dashboardPath = currentUser?.role === "admin" ? "/admin" : "/player";

  useEffect(() => {
    const refreshCurrentUser = () => {
      const validUser = getValidatedCurrentUser();

      if (!validUser) {
        sessionStorage.removeItem("currentUser");
      }

      setCurrentUser(validUser);
    };

    refreshCurrentUser();
    const interval = setInterval(refreshCurrentUser, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="App">
      <div className="header">
        <Link to="/">
          <h1>Bounty Game</h1>
        </Link>
        <p>Welcome to the Bounty Game!</p>
      </div>
      {!currentUser && (
        <div className="buttons">
          <Link to="/register">
            <button>Register</button>
          </Link>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? <Navigate to={dashboardPath} replace /> : <></>
          }
        />
        <Route
          path="/login"
          element={
            currentUser ? <Navigate to={dashboardPath} replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            currentUser ? <Navigate to={dashboardPath} replace /> : <Register />
          }
        />
        <Route
          path="/player"
          element={
            currentUser?.role === "player" ? (
              <PlayerDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            currentUser?.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/rounds" element={<Rounds />} />
      </Routes>
    </div>
  );
}

export default App;
