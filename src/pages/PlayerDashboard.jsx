import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BetSection from "./BetSection";
import { getBetHistory, getUserBalance, settleBetResults } from "../utils/game";

function PlayerDashboard() {
  const navigate = useNavigate();

  const [currentUser] = useState(() =>
    JSON.parse(sessionStorage.getItem("currentUser") || "null"),
  );

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [allRounds, setAllRounds] = useState(() =>
    JSON.parse(localStorage.getItem("bountyRounds") || "[]"),
  );

  const [selectedRoundId, setSelectedRoundId] = useState(null);

  const [balance, setBalance] = useState(() =>
    currentUser ? getUserBalance(currentUser.username) : 1000,
  );

  const [betHistory, setBetHistory] = useState(() =>
    currentUser ? getBetHistory(currentUser.username) : [],
  );

  useEffect(() => {
    if (!currentUser || currentUser.role !== "player") {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const latestTime = Date.now();
      const latestRounds = JSON.parse(
        localStorage.getItem("bountyRounds") || "[]",
      );

      setCurrentTime(latestTime);
      setAllRounds(latestRounds);

      if (currentUser) {
        settleBetResults(currentUser.username, latestRounds);
        setBalance(getUserBalance(currentUser.username));
        setBetHistory(getBetHistory(currentUser.username));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const activeRounds = allRounds.filter((round) => {
    const revealTime = new Date(round.revealTime).getTime();
    return revealTime > currentTime && !round.resultRevealed;
  });

  const selectedRound =
    activeRounds.find((round) => round.id === selectedRoundId) ||
    activeRounds[activeRounds.length - 1] ||
    null;

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  };

  return (
    <div className="PlayerDashboard">
      <div className="admin-page">
        <div className="admin-hero">
          <div className="hero-copy">
            <p className="eyebrow">Player Central Hub</p>
            <h2>Available Bounty Pools</h2>
            <p className="dashboard-subtitle">
              Select an active bounty pool below to place bets.
            </p>
          </div>
        </div>

        <div className="admin-section">
          <h3>Choose Active Bounty Round</h3>

          {activeRounds.length > 0 ? (
            <div className="top-grid selector-grid">
              {activeRounds.map((round) => (
                <div
                  className={`info-card selection-card ${
                    selectedRound?.id === round.id
                      ? "selection-card--active"
                      : ""
                  }`}
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                >
                  <span>Pool Game</span>
                  <strong>{round.roundTitle}</strong>
                  <small>
                    Ends:{" "}
                    {new Date(round.revealTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No active bounties are open right now.
            </p>
          )}
        </div>

        {selectedRound && currentUser && (
          <BetSection
            key={`${currentUser.username}-${selectedRound.id}`}
            balance={balance}
            currentTime={currentTime}
            currentUser={currentUser}
            selectedRound={selectedRound}
            setBalance={setBalance}
            setBetHistory={setBetHistory}
          />
        )}

        <div className="admin-section">
          <h3>Your Placed Bets History</h3>

          <div className="rounds-list">
            {betHistory.length > 0 ? (
              betHistory.map((bet) => {
                const outcomeClass = bet.outcome.toLowerCase();

                return (
                  <div className="round-item" key={bet.roundId}>
                    <div className="round-left">
                      <h4>{bet.roundTitle}</h4>
                      <p>
                        Round ID:
                        <span> {bet.roundId}</span>
                      </p>
                      <p>
                        Stake:
                        <span> Rs {bet.stakeAmount}</span>
                      </p>
                      <p>
                        Winning Number:
                        <span>{}</span>
                      </p>
                    </div>

                    <div className="round-right">
                      <span
                        className={`status-badge status-badge--${outcomeClass}`}
                      >
                        {bet.outcome}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No bet ledger transactions found.</p>
            )}
          </div>
        </div>

        <div className="logout">
          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerDashboard;
