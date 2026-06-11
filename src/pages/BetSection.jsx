import { useEffect, useState } from "react";
import {
  allowOnlyDigits,
  cleanPickValue,
  cleanStakeValue,
  createEmptyPicks,
  getBetHistory,
  getRoundOutcome,
  getUserBetsForRound,
  isValidGameNumber,
  updateUserBalance,
  validateStakeAmount,
} from "../utils/game";
import { writeStorage } from "../utils/storage";

function validateSingleRow(row, rowIndex) {
  const errors = [];

  const trimmedRow = row.map((cell) => cell.trim());

  if (!trimmedRow.some(Boolean)) {
    return { errors, rowHasValue: false };
  }

  trimmedRow.forEach((currentValue, cellIndex) => {
    if (!isValidGameNumber(currentValue)) {
      errors.push(
        `Chance ${rowIndex + 1}, Cell ${cellIndex + 1} must be a number between 1 and 99.`,
      );
      return;
    }

    if (trimmedRow.slice(cellIndex + 1).includes(currentValue)) {
      errors.push(
        `Chance ${rowIndex + 1} contains a duplicate entry: "${currentValue}".`,
      );
    }
  });

  return { errors, rowHasValue: true };
}

function validateBetForm(playerPicks, stakeAmount, balance) {
  const rowValidation = playerPicks.map((row, rowIndex) =>
    validateSingleRow(row, rowIndex),
  );
  const errors = rowValidation.flatMap((result) => result.errors);

  if (!rowValidation.some((result) => result.rowHasValue)) {
    errors.push("Please fill out at least one complete Chance card row.");
  }

  const stakeError = validateStakeAmount(stakeAmount, balance);
  if (stakeError) {
    errors.push(stakeError);
  }

  return errors;
}

function BetSection({
  balance,
  currentTime,
  currentUser,
  selectedRound,
  setBalance,
  setBetHistory,
}) {
  const [playerPicks, setPlayerPicks] = useState(() => createEmptyPicks());
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeError, setStakeError] = useState("");
  const [pickErrors, setPickErrors] = useState([]);
  const [pickStatus, setPickStatus] = useState("");

  const [betsInRound, setBetsInRound] = useState(
    () => getUserBetsForRound(currentUser.username, selectedRound.id).length,
  );

  const hasNoBalance = balance <= 0;

  useEffect(() => {
    if (!pickStatus) return undefined;

    const timer = setTimeout(() => {
      setPickStatus("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [pickStatus]);

  const handlePickChange = (chanceIndex, cellIndex, value) => {
    if (hasNoBalance) return;

    const updatedPicks = playerPicks.map((row) => [...row]);

    updatedPicks[chanceIndex][cellIndex] = cleanPickValue(value);

    setPlayerPicks(updatedPicks);
    setPickErrors([]);
    setPickStatus("");
  };

  const handleStakeChange = (e) => {
    if (hasNoBalance) return;

    const value = cleanStakeValue(e.target.value);
    setStakeAmount(value);
    setPickStatus("");
    setStakeError(validateStakeAmount(value, balance));
  };

  const handleSubmitBet = () => {
    if (hasNoBalance) {
      setPickStatus("You don't have enough balance to place a bet.");
      return;
    }

    const errors = validateBetForm(playerPicks, stakeAmount, balance);
    setPickErrors(errors);
    if (errors.length > 0) return;

    const betId = Date.now();
    const stakeValue = Number(stakeAmount);
    const newBalance = balance - stakeValue;

    updateUserBalance(currentUser.username, newBalance);
    setBalance(newBalance);

    const betKey = `bountyEntry_${currentUser.username}_${betId}`;
    writeStorage(betKey, {
      id: betId,
      username: currentUser.username,
      roundId: Number(selectedRound.id),
      roundTitle: selectedRound.roundTitle,
      stakeAmount,
      picks: playerPicks,
    });

    setBetsInRound((currentCount) => currentCount + 1);

    setPlayerPicks(createEmptyPicks());
    setStakeAmount("");
    setStakeError("");
    setPickErrors([]);
    setPickStatus("Bet placed successfully! You can place another bet.");
    setBetHistory(getBetHistory(currentUser.username));
  };

  const projectedPayout = Number(stakeAmount) * 10;

  const revealTime = new Date(selectedRound.revealTime).getTime();

  const isRevealReady =
    selectedRound.resultRevealed || revealTime <= currentTime;
  const roundResult = isRevealReady
    ? getRoundOutcome(currentUser.username, selectedRound.id)
    : "";
  const resultOutcome = isRevealReady
    ? roundResult || "Evaluating..."
    : "Hidden until reveal";
  const winningNumber = isRevealReady
    ? selectedRound.winningNumber
    : "Hidden until reveal";

  return (
    <>
      <div className="admin-top-bar">
        <h2>
          Active Pool: <span>{selectedRound.roundTitle}</span>
        </h2>
      </div>

      <div className="top-grid">
        <div className="info-card">
          <span>Active Stake</span>
          <strong>{stakeAmount ? `Rs ${stakeAmount}` : "Enter stake"}</strong>
        </div>
        <div className="info-card">
          <span>Win</span>
          <strong>{projectedPayout ? `Rs ${projectedPayout}` : "--"}</strong>
        </div>
        <div className="info-card">
          <span>Reveal Deadline</span>
          <strong>{new Date(selectedRound.revealTime).toLocaleString()}</strong>
        </div>
        <div className="info-card">
          <span>Bets Placed</span>
          <strong>{betsInRound}</strong>
        </div>
      </div>

      <div className="admin-section">
        <h3>Your Stake Amount</h3>
        <div className="admin-form-box full-width-box">
          <div className="field-group">
            <label>Stake amount</label>
            <input
              type="text"
              inputMode="numeric"
              disabled={hasNoBalance}
              placeholder="Enter amount"
              value={stakeAmount}
              onChange={handleStakeChange}
              onKeyDown={allowOnlyDigits}
            />
            {stakeError && <span className="form-error">{stakeError}</span>}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>Place Your Numbers</h3>
        <div className="chances-grid">
          {playerPicks.map((row, rowIndex) => (
            <div className="chance-card" key={rowIndex}>
              <div className="chance-card-head">
                <h4>Chance {rowIndex + 1}</h4>
                <span>9 inputs</span>
              </div>

              <div className="cells-grid">
                {row.map((value, cellIndex) => (
                  <input
                    key={cellIndex}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="00"
                    disabled={hasNoBalance}
                    value={value}
                    onChange={(e) =>
                      handlePickChange(rowIndex, cellIndex, e.target.value)
                    }
                    onKeyDown={allowOnlyDigits}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="add-round-button"
          onClick={handleSubmitBet}
          disabled={hasNoBalance}
        >
          {hasNoBalance ? "No Balance Left" : "Submit & Place Bet"}
        </button>

        {pickErrors.length > 0 && (
          <div className="pick-errors">
            {pickErrors.slice(0, 3).map((error, index) => (
              <span className="form-error" key={index}>
                {error}
              </span>
            ))}
          </div>
        )}

        {pickStatus && <div className="form-success">{pickStatus}</div>}
      </div>

      <div className="result-box">
        <div>
          <span>Selected Round</span>
          <strong>{selectedRound.roundTitle}</strong>
        </div>
        <div>
          <span>Result Outcome</span>
          <strong>{resultOutcome}</strong>
        </div>
        <div>
          <span>Winning Number</span>
          <strong>{winningNumber}</strong>
        </div>
        <div>
          <span>Timeline Status</span>
          <strong>{isRevealReady ? "Revealed" : "Scheduled"}</strong>
        </div>
      </div>
    </>
  );
}

export default BetSection;
