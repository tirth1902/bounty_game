import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Users() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    sessionStorage.getItem("currentUser") || "null",
  );
  const [users, setUsers] = useState(() =>
    JSON.parse(localStorage.getItem("users") || "[]"),
  );

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  const syncStorage = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  const handleDelete = (targetUsername) => {
    if (currentUser.username === targetUsername) {
      alert("Action Denied: You cannot delete your own admin account.");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete user "${targetUsername}"?`,
      )
    ) {
      const updated = users.filter((user) => user.username !== targetUsername);
      syncStorage(updated);
    }
  };

  return (
    <div className="AdminDashboard">
      <div className="admin-page">
        <div className="admin-hero">
          <div className="hero-copy">
            <h2>Registered Users Panel</h2>
            <p className="dashboard-subtitle">
              Review registered users and manage account removal.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            Back to Dashboard
          </button>
        </div>

        <div className="admin-section">
          {users.length > 0 ? (
            <div className="chances-grid">
              {users.map((user) => (
                <div className="chance-card" key={user.username}>
                  <div className="chance-card-head">
                    <h4>{user.username}</h4>
                    {user.username === currentUser?.username && <span>(You)</span>}
                  </div>

                  <div className="user-card-content">
                    <div>
                      <p>
                        <strong>Balance:</strong> ₹{user.balance}
                      </p>
                      <p>
                        <strong>Role:</strong> {user.role}
                      </p>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(user.username)}
                        disabled={user.username === currentUser?.username}
                      >
                        Delete User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
