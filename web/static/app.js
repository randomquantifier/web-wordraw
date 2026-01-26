const WIDTH = 5;
const HEIGHT = 6;
const STATES = ["o", "y", "g"];

const boardEl = document.getElementById("board");
const answerEl = document.getElementById("answer");
const statusEl = document.getElementById("status");

const grid = [];
const results = [];

function makeCell(row, col) {
  // Create a clickable cell that cycles through states on click.
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.state = "o";
  cell.dataset.row = String(row);
  cell.dataset.col = String(col);
  cell.addEventListener("click", () => {
    const idx = STATES.indexOf(cell.dataset.state);
    cell.dataset.state = STATES[(idx + 1) % STATES.length];
    onRowChange(row);
  });
  return cell;
}

function makeResult(row) {
  // Create the result display element for a row.
  const el = document.createElement("div");
  el.className = "row-result";
  el.dataset.row = String(row);
  el.textContent = "";
  return el;
}

for (let r = 0; r < HEIGHT; r++) {
  grid[r] = [];
  for (let c = 0; c < WIDTH; c++) {
    const cell = makeCell(r, c);
    grid[r][c] = cell;
    boardEl.appendChild(cell);
  }
  const result = makeResult(r);
  results[r] = result;
  boardEl.appendChild(result);
}

function getMode() {
  // Read the currently selected mode radio input.
  const checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : "first";
}

function rowPattern(row) {
  // Build the pattern string for a given row.
  return grid[row].map((cell) => cell.dataset.state).join("");
}

function setStatus(msg, isError = false) {
  // Update status text and color for feedback.
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#ff8a8a" : "var(--accent)";
}

async function onRowChange(row) {
  // Validate input and fetch matching words for a row's pattern.
  const answer = answerEl.value.trim().toLowerCase();
  if (answer.length !== WIDTH) {
    setStatus("Please enter a 5-letter answer.", true);
    results[row].textContent = "";
    results[row].className = "row-result";
    return;
  }

  const pattern = rowPattern(row);
  try {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        pattern,
        mode: getMode(),
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      results[row].textContent = "x";
      results[row].className = "row-result error";
      setStatus(data.error || "Request failed.", true);
      return;
    }

    setStatus("");
    if (data.first === null) {
      results[row].textContent = "x";
      results[row].className = "row-result error";
      return;
    }

    if (getMode() === "all" && Array.isArray(data.all)) {
      results[row].textContent = data.all.join(" ");
    } else {
      results[row].textContent = data.first;
    }
    results[row].className = "row-result success";
  } catch (err) {
    results[row].textContent = "x";
    results[row].className = "row-result error";
    setStatus("Network error.", true);
  }
}

function onModeChange() {
  // Refresh results when switching between first/all modes.
  for (let r = 0; r < HEIGHT; r++) {
    if (rowPattern(r).length === WIDTH) {
      onRowChange(r);
    }
  }
}

answerEl.addEventListener("input", () => {
  if (answerEl.value.length > WIDTH) {
    answerEl.value = answerEl.value.slice(0, WIDTH);
  }
  for (let r = 0; r < HEIGHT; r++) {
    results[r].textContent = "";
    results[r].className = "row-result";
  }
  setStatus("");
});

document.querySelectorAll('input[name="mode"]').forEach((el) => {
  el.addEventListener("change", onModeChange);
});
