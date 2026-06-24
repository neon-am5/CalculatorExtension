const state = {
    current: '0',
    previous: null,
    operator: null,
    waitingNext: false,
    expression: '',

};

const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');

function fmt(n) {
    let s;
    s = parseFloat(n.toPrecision(12)).toString();
    return s;
}

function updateDisplay() {
    const val = state.current;
    resultEl.textContent = val;
    expressionEl.textContent = state.expression;

    // Scale text if too long
    resultEl.classList.remove('small', 'xsmall', 'error');
    if (val.length > 12) resultEl.classList.add('xsmall');
    else if (val.length > 8) resultEl.classList.add('small');
}

function setResult(val, expr = '') {
    state.current    = val;
    state.expression = expr;
    updateDisplay();
}

// ── Actions ──────────────────────────────────────────────────────────────────
function inputNumber(digit) {
    if (state.waitingNext) {
        state.current    = digit;
        state.waitingNext = false;
    } else {
        state.current = state.current === '0' ? digit : state.current + digit;
    }
    updateDisplay();
}

function inputDecimal() {
    if (state.waitingNext) {
        state.current    = '0.';
        state.waitingNext = false;
        updateDisplay();
        return;
    }
    if (!state.current.includes('.')) {
        state.current += '.';
        updateDisplay();
    }
}

function clear() {
    state.current     = '0';
    state.previous    = null;
    state.operator    = null;
    state.waitingNext = false;
    state.expression  = '';
    clearActiveOp();
    updateDisplay();
}

function toggleSign() {
    const n = parseFloat(state.current);
    if (isNaN(n)) return;
    state.current = fmt(n * -1);
    updateDisplay();
}

function percent() {
    const n = parseFloat(state.current);
    if (isNaN(n)) return;
    state.current = fmt(n / 100);
    updateDisplay();
}

function calculate(a, op, b) {
    switch (op) {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? null : a / b;
        default:  return b;
    }
}

function setOperator(op) {
    const cur = parseFloat(state.current);

    if (state.operator && !state.waitingNext) {
        // Chain calculation
        const prev   = parseFloat(state.previous);
        const result = calculate(prev, state.operator, cur);
        if (result === null) {
            showError('Error');
            return;
        }
        state.current    = fmt(result);
        state.expression = `${fmt(result)} ${op}`;
    } else {
        state.expression = `${state.current} ${op}`;
    }

    state.previous    = state.current;
    state.operator    = op;
    state.waitingNext = true;

    highlightOp(op);
    updateDisplay();
}

function equals() {
    if (!state.operator || state.previous === null) return;

    const a   = parseFloat(state.previous);
    const b   = parseFloat(state.current);
    const res = calculate(a, state.operator, b);

    if (res === null) {
        showError("Can't ÷ by 0");
        return;
    }

    const expr = `${fmt(a)} ${state.operator} ${fmt(b)} =`;
    const val  = fmt(res);

    state.expression  = expr;
    state.current     = val;
    state.previous    = null;
    state.operator    = null;
    state.waitingNext = true;

    clearActiveOp();
    updateDisplay();
}

function showError(msg) {
    resultEl.textContent = msg;
    resultEl.classList.add('error');
    state.current     = '0';
    state.previous    = null;
    state.operator    = null;
    state.waitingNext = false;
    state.expression  = '';
    setTimeout(() => {
        resultEl.classList.remove('error');
        updateDisplay();
    }, 1500);
}

// ── Operator highlight ────────────────────────────────────────────────────────
function highlightOp(op) {
    clearActiveOp();
    document.querySelectorAll('.btn-operator').forEach(btn => {
        if (btn.dataset.value === op) btn.classList.add('active');
    });
}
function clearActiveOp() {
    document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active'));
}

// ── Event delegation ──────────────────────────────────────────────────────────
document.querySelector('.keypad').addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const { action, value } = btn.dataset;

    switch (action) {
        case 'number':   inputNumber(value); break;
        case 'decimal':  inputDecimal();     break;
        case 'clear':    clear();            break;
        case 'sign':     toggleSign();       break;
        case 'percent':  percent();          break;
        case 'operator': setOperator(value); break;
        case 'equals':   equals();           break;
    }
});

// ── Keyboard support ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') inputNumber(e.key);
    else if (e.key === '.')                inputDecimal();
    else if (e.key === '+')                setOperator('+');
    else if (e.key === '-')                setOperator('−');
    else if (e.key === '*')                setOperator('×');
    else if (e.key === '/')                { e.preventDefault(); setOperator('÷'); }
    else if (e.key === 'Enter' || e.key === '=') equals();
    else if (e.key === 'Escape')           clear();
    else if (e.key === 'Backspace') {
        if (state.current.length > 1) {
            state.current = state.current.slice(0, -1) || '0';
        } else {
            state.current = '0';
        }
        updateDisplay();
    }
    else if (e.key === '%') percent();
});

// ── Init ──────────────────────────────────────────────────────────────────────
updateDisplay();
