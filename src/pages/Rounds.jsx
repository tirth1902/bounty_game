import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Rounds() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    sessionStorage.getItem("currentUser") || "null",
  );
  const rounds = JSON.parse(localStorage.getItem("bountyRounds") || "[]");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="rounds-page">
      <h2>Created Rounds</h2>

      {rounds.length > 0 ? (
        rounds.map((round) => (
          <div className="round-card" key={round.id}>
            <p>
              <strong>Round:</strong> {round.roundTitle}
            </p>

            <p>
              <strong>Reveal Time:</strong>{" "}
              {new Date(round.revealTime).toLocaleString()}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {round.resultRevealed ? "Revealed" : "Hidden"}
            </p>

            {round.resultRevealed && (
              <p>
                <strong>Winning Number:</strong> {round.winningNumber}
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No rounds created.</p>
      )}
    </div>
  );
}

export default Rounds;
