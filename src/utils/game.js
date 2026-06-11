import { readStorage, writeStorage } from "./storage";

export const CHANCES = [1, 2, 3, 4, 5, 6];
export const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createEmptyPicks() {
  return CHANCES.map(() => CELLS.map(() => ""));
}

export function cleanPickValue(value) {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function cleanStakeValue(value) {
  return value.replace(/\D/g, "");
}

export function allowOnlyDigits(e) {
  if (e.key.length === 1 && (e.key < "0" || e.key > "9")) {
    e.preventDefault();
  }
}

export function isValidGameNumber(value) {
  const cleanValue = value.trim();
  if (cleanValue === "") return false;

  const numberValue = Number(cleanValue);
  return numberValue >= 1 && numberValue <= 99;
}

export function validateStakeAmount(stakeAmount, balance) {
  if (!stakeAmount.trim()) {
    return "Stake amount is required.";
  }

  if (Number(stakeAmount) <= 0) {
    return "Stake amount must be greater than 0.";
  }

  if (Number(stakeAmount) > balance) {
    return "Stake amount cannot exceed your wallet balance.";
  }

  return "";
}

export function formatRevealTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export function getUserBalance(username) {
  const users = readStorage("users", []);
  const user = users.find((item) => item.username === username);
  return Number(user?.balance ?? 1000);
}

export function updateUserBalance(username, newBalance) {
  const users = readStorage("users", []);
  const updatedUsers = users.map((user) =>
    user.username === username ? { ...user, balance: newBalance } : user,
  );
  writeStorage("users", updatedUsers);
}

export function getUserBetsForRound(username, roundId) {
  if (!username || !roundId) return [];

  return Object.keys(localStorage)
    .filter((key) => key.startsWith(`bountyEntry_${username}_`))
    .map((key) => readStorage(key, null))
    .filter((bet) => bet && String(bet.roundId) === String(roundId));
}

export function getRoundOutcome(username, roundId) {
  if (!username || !roundId) return "";

  const bets = getUserBetsForRound(username, roundId);
  if (bets.length === 0) return "";

  let wins = 0;
  let losses = 0;

  for (let i = 0; i < bets.length; i += 1) {
    const resultKey = `bountyResult_${username}_${bets[i].id}`;
    const result = readStorage(resultKey, null);
    if (result) {
      if (result.outcome === "Win") {
        wins = wins + 1;
      } else {
        losses = losses + 1;
      }
    }
  }

  if (wins === 0 && losses === 0) return "";

  if (wins > 0 && losses === 0) {
    return "Won (" + wins + " bet" + (wins > 1 ? "s" : "") + ")";
  }
  if (wins === 0 && losses > 0) {
    return "Lost (" + losses + " bet" + (losses > 1 ? "s" : "") + ")";
  }
  return wins + " Win, " + losses + " Loss";
}

export function getBetHistory(username) {
  if (!username) return [];

  return Object.keys(localStorage)
    .filter((key) => key.startsWith(`bountyEntry_${username}_`))
    .map((key) => {
      const bet = readStorage(key);

      const result = readStorage(
        `bountyResult_${username}_${bet.id}`,
        null,
      );

      const rounds = readStorage("bountyRounds", []);
      const round = rounds.find(
        (item) => String(item.id) === String(bet.roundId),
      );

      return {
        ...bet,
        outcome: result?.outcome || "Pending",
        winningNumber: result?.winningNumber || round?.winningNumber || "--",
      };
    })
    .sort((a, b) => b.id - a.id);
}

export function settleBetResults(username, rounds) {
  if (!username) return;

  const userBets = Object.keys(localStorage)
    .filter((key) => key.startsWith(`bountyEntry_${username}_`))
    .map((key) => readStorage(key, null))
    .filter(Boolean);

  for (let i = 0; i < userBets.length; i += 1) {
    const bet = userBets[i];

    const resultKey = `bountyResult_${username}_${bet.id}`;
    const existingResult = readStorage(resultKey, null);

    if (existingResult) continue;

    const round = rounds.find(
      (currentRound) => String(currentRound.id) === String(bet.roundId),
    );
    if (!round) continue;

    const revealTimePassed = new Date(round.revealTime).getTime() <= Date.now();
    const canShowResult = round.resultRevealed || revealTimePassed;
    if (!canShowResult) continue;

    const isWin = bet.picks.some((row) =>
      row.includes(String(round.winningNumber)),
    );
    const finalResult = isWin ? "Win" : "Loss";

    const stakeValue = Number(bet.stakeAmount);
    if (isWin) {
      const newBalance = getUserBalance(username) + stakeValue * 10;
      updateUserBalance(username, newBalance);
    } else {
      const newBalance = getUserBalance(username) + stakeValue;
      updateUserBalance(username, newBalance);
    }

    writeStorage(resultKey, {
      outcome: finalResult,
      stake: bet.stakeAmount,
      roundId: bet.roundId,
      betId: bet.id,
      winningNumber: round.winningNumber,
    });
  }
}
