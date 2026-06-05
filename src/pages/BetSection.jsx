import { useState } from "react";
import {
  allowOnlyDigits,
  cleanPickValue,
  cleanStakeValue,
  createEmptyPicks,
  getBetHistory,
  isValidGameNumber,
  updateUserBalance,
  validateStakeAmount,
} from "../utils/game";
import { readStorage, writeStorage } from "../utils/storage";

function validateSingleRow(row, rowIndex) {
  const errors = [];
  let rowHasValue = false;

  for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
    if (row[cellIndex].trim() !== "") {
      rowHasValue = true;
    }
  }

  if (!rowHasValue) {
    return { errors, rowHasValue: false };
  }

  for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
    const currentValue = row[cellIndex].trim();

    if (!isValidGameNumber(currentValue)) {
      errors.push(
        `Chance ${rowIndex + 1}, Cell ${cellIndex + 1} must be a number between 1 and 99.`,
      );
      continue;
    }

    for (
      let nextCellIndex = cellIndex + 1;
      nextCellIndex < row.length;
      nextCellIndex += 1
    ) {
      const nextValue = row[nextCellIndex].trim();
      if (currentValue === nextValue) {
        errors.push(
          `Chance ${rowIndex + 1} contains a duplicate entry: "${currentValue}".`,
        );
        break;
      }
    }
  }

  return { errors, rowHasValue: true };
}

function validateBetForm(playerPicks, stakeAmount, balance) {
  const errors = [];
  let hasAtLeastOneFilledRow = false;

  for (let rowIndex = 0; rowIndex < playerPicks.length; rowIndex += 1) {
    const rowValidation = validateSingleRow(playerPicks[rowIndex], rowIndex);
    if (rowValidation.rowHasValue) {
      hasAtLeastOneFilledRow = true;
    }

    for (
      let errorIndex = 0;
      errorIndex < rowValidation.errors.length;
      errorIndex += 1
    ) {
      errors.push(rowValidation.errors[errorIndex]);
    }
  }

  if (!hasAtLeastOneFilledRow) {
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
  const savedBet = readStorage(
    `bountyEntry_${currentUser.username}_${selectedRound.id}`,
    null,
  );

  const [playerPicks, setPlayerPicks] = useState(
    () => savedBet?.picks || createEmptyPicks(),
  );
  const [stakeAmount, setStakeAmount] = useState(savedBet?.stakeAmount || "");
  const [stakeError, setStakeError] = useState("");
  const [pickErrors, setPickErrors] = useState([]);
  const [pickStatus, setPickStatus] = useState(
    savedBet ? "Your bet is locked in for this round." : "",
  );
  const [hasPlacedBet, setHasPlacedBet] = useState(Boolean(savedBet));

  const handlePickChange = (chanceIndex, cellIndex, value) => {
    if (hasPlacedBet) return;

    const updatedPicks = playerPicks.map((row) => [...row]);
    updatedPicks[chanceIndex][cellIndex] = cleanPickValue(value);

    setPlayerPicks(updatedPicks);
    setPickErrors([]);
    setPickStatus("");
  };

  const handleStakeChange = (e) => {
    if (hasPlacedBet) return;

    const value = cleanStakeValue(e.target.value);
    setStakeAmount(value);
    setPickStatus("");
    setStakeError(validateStakeAmount(value, balance));
  };

  const handleSubmitBet = () => {
    if (hasPlacedBet) return;


    const errors = validateBetForm(playerPicks, stakeAmount, balance);
    setPickErrors(errors);
    if (errors.length > 0) return;

    const newBalance = balance - Number(stakeAmount);
    updateUserBalance(currentUser.username, newBalance);
    setBalance(newBalance);

    writeStorage(`bountyEntry_${currentUser.username}_${selectedRound.id}`, {
      id: Date.now(),
      username: currentUser.username,
      roundId: Number(selectedRound.id),
      roundTitle: selectedRound.roundTitle,
      stakeAmount,
      picks: playerPicks,
    });

    setHasPlacedBet(true);
    setPickStatus("Bet successfully placed! Balance updated.");
    setBetHistory(getBetHistory(currentUser.username));
  };

  const projectedPayout = Number(stakeAmount) * 10;
  const isRevealReady =
    selectedRound.resultRevealed ||
    new Date(selectedRound.revealTime).getTime() <= currentTime;
  const roundResult =
    readStorage(
      `bountyResult_${currentUser.username}_${selectedRound.id}`,
      null,
    )?.outcome || "";

  return (
    <>
      <div className="admin-top-bar">
        <h2>
          Active Pool: <span>{selectedRound.roundTitle}</span>
        </h2>
      </div>

      <div className="top-grid">
        <div className="info-card">
          <span>Your Balance</span>
          <strong>Rs {balance}</strong>
        </div>
        <div className="info-card">
          <span>Active Stake</span>
          <strong>{stakeAmount ? `Rs ${stakeAmount}` : "Enter stake"}</strong>
        </div>
        <div className="info-card">
          <span>Win (10x)</span>
          <strong>{projectedPayout ? `Rs ${projectedPayout}` : "--"}</strong>
        </div>
        <div className="info-card">
          <span>Reveal Deadline</span>
          <strong>{new Date(selectedRound.revealTime).toLocaleString()}</strong>
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
              disabled={hasPlacedBet}
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
                    disabled={hasPlacedBet}
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
          disabled={hasPlacedBet}
        >
          {hasPlacedBet ? "Bet Locked In" : "Submit & Place Bet"}
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
          <strong>
            {isRevealReady
              ? roundResult || "Evaluating..."
              : "Hidden until reveal"}
          </strong>
        </div>
        <div>
          <span>Winning Number</span>
          <strong>
            {isRevealReady
              ? selectedRound.winningNumber
              : "Hidden until reveal"}
          </strong>
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
