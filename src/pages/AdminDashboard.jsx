import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { settleBetResults } from "../utils/game";
import {
  formatRevealTime,
  getAllRoundBets,
  sanitizeRoundTitle,
  validateRoundForm,
} from "../utils/rounds";
import { getUsers } from "../utils/storage";

const CHANCES = [1, 2, 3, 4, 5, 6];
const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function AdminDashboard() {
  const navigate = useNavigate();

  const [currentUser] = useState(() =>
    JSON.parse(sessionStorage.getItem("currentUser") || "null"),
  );

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [allRounds, setAllRounds] = useState(() =>
    JSON.parse(localStorage.getItem("bountyRounds") || "[]"),
  );

  const [roundForm, setRoundForm] = useState({
    roundTitle: "",
    revealTime: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [formStatus, setFormStatus] = useState("");

  const [allBets, setAllBets] = useState([]);
  const [selectedBetPreview, setSelectedBetPreview] = useState(null);

  const activeBounties = allRounds.filter(
    (round) =>
      new Date(round.revealTime).getTime() > currentTime &&
      !round.resultRevealed,
  );

  const activeRound =
    activeBounties.length > 0
      ? activeBounties[activeBounties.length - 1]
      : null;

  const activeRounds = [...activeBounties].sort(
    (a, b) =>
      new Date(a.revealTime).getTime() - new Date(b.revealTime).getTime(),
  );

  const finishedRounds = allRounds
    .filter((round) => {
      const revealTime = new Date(round.revealTime).getTime();
      return (
        round.resultRevealed ||
        (Number.isFinite(revealTime) && revealTime <= currentTime)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.revealTime).getTime() - new Date(a.revealTime).getTime(),
    );

  const settleAllPlayerBets = useCallback((rounds) => {
    getUsers()
      .filter((user) => user.role === "player")
      .forEach((user) => {
        settleBetResults(user.username, rounds);
      });
  }, []);

  const revealDueRounds = useCallback(() => {
    const latestTime = Date.now();

    const rounds = JSON.parse(localStorage.getItem("bountyRounds") || "[]");

    const nextRounds = rounds.map((round) => {
      const revealTime = new Date(round.revealTime).getTime();
      const shouldReveal =
        !round.resultRevealed &&
        Number.isFinite(revealTime) &&
        revealTime <= latestTime;

      return shouldReveal ? { ...round, resultRevealed: true } : round;
    });

    const hasChanges = nextRounds.some(
      (round, index) => round.resultRevealed !== rounds[index]?.resultRevealed,
    );

    setCurrentTime(latestTime);
    setAllRounds(nextRounds);

    if (hasChanges) {
      localStorage.setItem("bountyRounds", JSON.stringify(nextRounds));
      settleAllPlayerBets(nextRounds);
      setSelectedBetPreview(null);
    }
  }, [settleAllPlayerBets]);

  const revealResult = (roundId) => {
    const updatedRounds = allRounds.map((round) =>
      round.id === roundId ? { ...round, resultRevealed: true } : round,
    );

    setAllRounds(updatedRounds);
    localStorage.setItem("bountyRounds", JSON.stringify(updatedRounds));
    settleAllPlayerBets(updatedRounds);

    if (activeRound && activeRound.id === roundId) {
      setSelectedBetPreview(null);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const syncAdminData = () => {
      const rounds = JSON.parse(localStorage.getItem("bountyRounds") || "[]");
      const now = Date.now();
      setCurrentTime(now);
      setAllRounds(rounds);

      setAllBets(getAllRoundBets());
    };

    const interval = setInterval(syncAdminData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(revealDueRounds, 1000);
    return () => clearInterval(interval);
  }, [revealDueRounds]);

  useEffect(() => {
    const hasMessages = formStatus || Object.keys(formErrors).length > 0;

    if (!hasMessages) return undefined;

    const timer = setTimeout(() => {
      setFormStatus("");
      setFormErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [formErrors, formStatus]);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  };

  const handleRoundChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "roundTitle" ? sanitizeRoundTitle(value) : value;

    setRoundForm((prev) => ({ ...prev, [name]: nextValue }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddRound = () => {
    const nextErrors = validateRoundForm(roundForm);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormStatus("");
      return;
    }

    const randomWinningNumber = Math.floor(Math.random() * 99) + 1;

    const newRound = {
      id: Date.now(),
      roundTitle: roundForm.roundTitle.trim(),
      revealTime: roundForm.revealTime,
      winningNumber: String(randomWinningNumber),
      resultRevealed: false,
    };

    const nextRounds = [...allRounds, newRound];
    setAllRounds(nextRounds);
    localStorage.setItem("bountyRounds", JSON.stringify(nextRounds));

    setFormStatus("Round created successfully.");
    setRoundForm({ roundTitle: "", revealTime: "" });
  };

  return (
    <div className="AdminDashboard">
      <div className="admin-page" onClick={() => setSelectedBetPreview(null)}>
        <div>
          <button type="button" onClick={() => navigate("/admin/users")}>
            Users
          </button>
        </div>
        <div className="admin-hero">
          <div className="hero-copy">
            <p className="eyebrow">Bounty Game Admin</p>
            <h2>Control the next prize round</h2>
            <p className="dashboard-subtitle">
              Welcome, {currentUser?.username || "admin"}. Create the chance
              set, lock the reveal time, and release the winning number when the
              round ends.
            </p>
          </div>

          <div className="hero-badges">
            <span>6 chances</span>
            <span>1 to 99 numbers</span>
            <span>10x win payout</span>
          </div>
        </div>

        <div className="admin-section admin-section--split">
          <div>
            <h3>Round Setup</h3>
            <div className="admin-form-box full-width-box">
              <div className="field-group">
                <label htmlFor="roundTitle">Round title</label>
                <input
                  id="roundTitle"
                  name="roundTitle"
                  type="text"
                  placeholder="Enter round title"
                  value={roundForm.roundTitle}
                  onChange={handleRoundChange}
                  inputMode="text"
                  autoComplete="off"
                />
                {formErrors.roundTitle && (
                  <span className="form-error">{formErrors.roundTitle}</span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="revealTime">Reveal time</label>
                <input
                  id="revealTime"
                  name="revealTime"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={roundForm.revealTime}
                  onChange={handleRoundChange}
                />
                {formErrors.revealTime && (
                  <span className="form-error">{formErrors.revealTime}</span>
                )}
              </div>

              <div className="field-group">
                <label>Winning number</label>
                <p className="auto-pick-note">
                  Randomly picked from 1 to 99 when round is created, and Show
                  only after reveal.
                </p>
              </div>

              <button
                type="button"
                className="add-round-button"
                onClick={handleAddRound}
              >
                Add Round
              </button>

              {formStatus && <div className="form-success">{formStatus}</div>}
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h3>Active Rounds</h3>
          {activeRounds.length > 0 ? (
            <div className="rounds-list">
              {activeRounds.map((round) => (
                <div className="round-item" key={round.id}>
                  <div className="round-left">
                    <h4>{round.roundTitle}</h4>
                    <p>
                      Reveal Time:
                      <span> {formatRevealTime(round.revealTime)}</span>
                    </p>
                    <p>
                      Status:
                      <span> Live / Active</span>
                    </p>
                  </div>

                  <div className="round-right">
                    <div className="winning-result">
                      Winning Number: Hidden until round ends
                    </div>
                    <button
                      className="reveal-btn"
                      type="button"
                      onClick={() => revealResult(round.id)}
                    >
                      Reveal Result Manually
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No active rounds right now.</p>
          )}
        </div>

        <div className="admin-section" onClick={(e) => e.stopPropagation()}>
          <h3>Users Placed Bets</h3>
          {allBets.length > 0 ? (
            <div className="top-grid selector-grid">
              {allBets.map((bet) => (
                <div
                  className={`info-card selection-card ${
                    selectedBetPreview?.id === bet.id
                      ? "selection-card--active"
                      : ""
                  }`}
                  key={bet.id}
                  onClick={() => setSelectedBetPreview(bet)}
                >
                  <span>User Placed Bet</span>
                  <strong> {bet.username}</strong>
                  <small>Round: {bet.roundTitle}</small>
                  <small>Stake: ₹{bet.stakeAmount}</small>
                  <small>Win No.: {bet.winningNumber || "--"}</small>
                  {bet.isEnded ? (
                    <span
                      className={`bet-outcome-label ${
                        bet.outcome === "Win"
                          ? "bet-outcome--win"
                          : "bet-outcome--loss"
                      }`}
                    >
                      {bet.outcome === "Win" ? "Win" : "Loss"}
                    </span>
                  ) : (
                    <span className="bet-outcome-label bet-outcome--live">
                      LIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No bets have been recorded yet.</p>
          )}
        </div>

        <div className="admin-section" onClick={(e) => e.stopPropagation()}>
          <h3>
            6 Chances Preview{" "}
            {selectedBetPreview && (
              <span className="form-success">
                (Viewing: {selectedBetPreview.username}'s Board)
              </span>
            )}
          </h3>
          <div className="chances-grid">
            {CHANCES.map((chance, chanceIdx) => {
              const chancePicks = selectedBetPreview?.picks?.[chanceIdx] || [];

              return (
                <div className="chance-card" key={chance}>
                  <div className="chance-card-head">
                    <h4>Chance {chance}</h4>
                  </div>
                  <div className="cells-grid">
                    {CELLS.map((cell, cellIdx) => (
                      <input
                        key={cell}
                        type="text"
                        placeholder="--"
                        value={chancePicks[cellIdx] || ""}
                        disabled
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-section">
          <h3>Current Round Status</h3>
          <div className="result-box">
            <div>
              <span>Reveal status</span>
              <strong>
                {activeRound
                  ? activeRound.resultRevealed
                    ? "Revealed"
                    : "Hidden"
                  : "No active round"}
              </strong>
            </div>
            <div>
              <span>Round time</span>
              <strong>
                {activeRound
                  ? formatRevealTime(activeRound.revealTime)
                  : "Auto reveal later"}
              </strong>
            </div>
            <div>
              <span>Round name</span>
              <strong>
                {activeRound ? activeRound.roundTitle : "Not created"}
              </strong>
            </div>
            <div>
              <span>Winning number</span>
              <strong>
                {activeRound
                  ? activeRound.resultRevealed
                    ? activeRound.winningNumber
                    : "Hidden until reveal"
                  : "--"}
              </strong>
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h3>Finished Rounds</h3>
          <div className="rounds-list">
            {finishedRounds.length > 0 ? (
              finishedRounds.map((round) => (
                <div className="round-item" key={round.id}>
                  <div className="round-left">
                    <h4>{round.roundTitle}</h4>
                    <p>
                      Reveal Time:
                      <span> {formatRevealTime(round.revealTime)}</span>
                    </p>
                    <p>
                      Status:
                      <span>
                        {round.resultRevealed
                          ? " Revealed"
                          : " Finished / Waiting for reveal"}
                      </span>
                    </p>
                  </div>

                  <div className="round-right">
                    {round.resultRevealed ? (
                      <div className="winning-result">
                        Winning Number: {round.winningNumber}
                      </div>
                    ) : (
                      <button
                        className="reveal-btn"
                        type="button"
                        onClick={() => revealResult(round.id)}
                      >
                        Reveal Result Manually
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No finished rounds yet.</p>
            )}
          </div>
        </div>

        <div className="logout">
          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
