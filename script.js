/* =========================================================
   CodeAlpha Task 2 — Calculator logic
   Plain vanilla JavaScript, no eval(), beginner-readable.
   ========================================================= */

// ---- Grab the elements we need ----
const expressionEl = document.getElementById('expression');
const currentEl = document.getElementById('current');
const historyListEl = document.getElementById('historyList');
const historyEmptyEl = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistory');

const numberButtons = document.querySelectorAll('[data-number]');
const actionButtons = document.querySelectorAll('[data-action]');

// ---- Calculator state ----
// currentInput is always the string shown as the "active" number.
let currentInput = '0';
let firstOperand = null;      // number, or null if nothing stored yet
let operator = null;          // '+', '-', '*', '/' or null
let waitingForSecondOperand = false; // true right after an operator is pressed

const MAX_DIGITS = 12; // stops the display from overflowing the calculator body

// Keeps only the last few calculations
const MAX_HISTORY_ITEMS = 6;
let history = [];

// ---- Helpers ----

// Turns '+', '-', '*', '/' into the symbol we actually want to display
function operatorSymbol(op) {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
    default: return '';
  }
}

// Rounds away tiny floating point errors, e.g. 0.1 + 0.2 !== 0.30000000004
function cleanNumber(num) {
  return Math.round((num + Number.EPSILON) * 1e10) / 1e10;
}

// Redraws the display based on the current state
function updateDisplay() {
  currentEl.classList.remove('is-error');

  if (operator && firstOperand !== null) {
    expressionEl.textContent = `${firstOperand} ${operatorSymbol(operator)}`;
  } else {
    expressionEl.textContent = '';
  }

  currentEl.textContent = currentInput;
}

// Shows an error message on the display without crashing the calculator
function showError(message) {
  expressionEl.textContent = '';
  currentEl.textContent = message;
  currentEl.classList.add('is-error');

  // Reset the math state so the next key press starts clean
  currentInput = '0';
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
}

// ---- Core actions ----

function inputDigit(digit) {
  if (waitingForSecondOperand) {
    currentInput = digit;
    waitingForSecondOperand = false;
  } else {
    if (currentInput.replace('-', '').length >= MAX_DIGITS) {
      return; // ignore extra digits once we hit the display limit
    }
    currentInput = currentInput === '0' ? digit : currentInput + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (waitingForSecondOperand) {
    currentInput = '0.';
    waitingForSecondOperand = false;
    updateDisplay();
    return;
  }
  // Prevent a second decimal point in the same number
  if (!currentInput.includes('.')) {
    currentInput += '.';
    updateDisplay();
  }
}

function calculate(first, second, op) {
  switch (op) {
    case '+':
      return cleanNumber(first + second);
    case '-':
      return cleanNumber(first - second);
    case '*':
      return cleanNumber(first * second);
    case '/':
      if (second === 0) {
        showError('Cannot divide by zero');
        return null;
      }
      return cleanNumber(first / second);
    default:
      return second;
  }
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(currentInput);

  // Pressing an operator right after another operator just swaps it
  if (operator && waitingForSecondOperand) {
    operator = nextOperator;
    updateDisplay();
    return;
  }

  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    const result = calculate(firstOperand, inputValue, operator);
    if (result === null) {
      return; // showError() already redrew the display — don't call updateDisplay here
    }
    firstOperand = result;
    currentInput = String(result);
  }

  waitingForSecondOperand = true;
  operator = nextOperator;
  updateDisplay();
}

function handleEquals() {
  if (operator === null || firstOperand === null) {
    return; // nothing to calculate yet
  }

  const inputValue = parseFloat(currentInput);
  const result = calculate(firstOperand, inputValue, operator);

  if (result === null) {
    return; // showError() already redrew the display — don't call updateDisplay here
  }

  addHistoryEntry(`${firstOperand} ${operatorSymbol(operator)} ${inputValue}`, result);

  currentInput = String(result);
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = true;
  updateDisplay();
}

function resetCalculator() {
  currentInput = '0';
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  updateDisplay();
}

function deleteLast() {
  if (currentInput.length > 1) {
    currentInput = currentInput.slice(0, -1);
  } else {
    currentInput = '0';
  }
  if (currentInput === '-') {
    currentInput = '0';
  }
  updateDisplay();
}

function toggleSign() {
  if (currentInput === '0') return;
  currentInput = currentInput.startsWith('-')
    ? currentInput.slice(1)
    : '-' + currentInput;
  updateDisplay();
}

function applyPercent() {
  // Simple behaviour: turns the number on screen into a hundredth of itself.
  const value = parseFloat(currentInput);
  currentInput = String(cleanNumber(value / 100));
  updateDisplay();
}

// ---- History ----

function addHistoryEntry(expression, result) {
  history.unshift({ expression, result });
  if (history.length > MAX_HISTORY_ITEMS) {
    history.pop();
  }
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = '';

  if (history.length === 0) {
    historyListEl.appendChild(historyEmptyEl);
    return;
  }

  history.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.textContent = `${entry.expression} = ${entry.result}`;
    historyListEl.appendChild(li);
  });
}

function clearHistory() {
  history = [];
  renderHistory();
}

// ---- Wiring up button clicks ----

numberButtons.forEach((button) => {
  button.addEventListener('click', () => {
    inputDigit(button.dataset.number);
  });
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    handleAction(button.dataset.action);
  });
});

clearHistoryBtn.addEventListener('click', clearHistory);

function handleAction(action) {
  switch (action) {
    case 'add':
      handleOperator('+');
      break;
    case 'subtract':
      handleOperator('-');
      break;
    case 'multiply':
      handleOperator('*');
      break;
    case 'divide':
      handleOperator('/');
      break;
    case 'equals':
      handleEquals();
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'clear':
      resetCalculator();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'sign':
      toggleSign();
      break;
    case 'percent':
      applyPercent();
      break;
    default:
      break;
  }
}

// ---- Keyboard support ----

document.addEventListener('keydown', (event) => {
  const { key } = event;

  if (key >= '0' && key <= '9') {
    inputDigit(key);
    return;
  }

  switch (key) {
    case '.':
      inputDecimal();
      break;
    case '+':
      handleOperator('+');
      break;
    case '-':
      handleOperator('-');
      break;
    case '*':
      handleOperator('*');
      break;
    case '/':
      event.preventDefault(); // stops the browser's quick "find" shortcut
      handleOperator('/');
      break;
    case 'Enter':
    case '=':
      event.preventDefault();
      handleEquals();
      break;
    case 'Escape':
      resetCalculator();
      break;
    case 'Backspace':
      deleteLast();
      break;
    default:
      break; // ignore any other key
  }
});

// ---- Initial paint ----
updateDisplay();
