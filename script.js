// ============================================
// iOS SAFARI — disable pinch zoom + double-tap zoom
// ============================================
(function preventMobileZoom() {
    // Pinch-zoom kill (iOS gestures)
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
        document.addEventListener(evt, e => e.preventDefault(), { passive: false });
    });

    // Double-tap zoom kill
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 350) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

    // Multi-touch zoom kill (backup)
    document.addEventListener('touchmove', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
})();




const menuBtn = document.querySelector('.menu-btn');
const closeBtn = document.querySelector('.menu-btn-close');
const sidebar = document.querySelector('.sidebar');
 
const modeItems = document.querySelectorAll('.mode-item');
const modeName = document.querySelector('.mode-name');
const allModes = document.querySelectorAll('.calc-mode');
 
 
// -------- Sidebar open / close --------
menuBtn.addEventListener('click', () => {
    document.querySelector('.history-panel')?.classList.remove('open');
    sidebar.classList.add('open');
});
closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
 
 
// ============================================
// HISTORY MODULE (shared across all calc modes)
// ============================================
const historyBtn = document.querySelector('.history-btn');
const historyPanel = document.querySelector('.history-panel');
const historyCloseBtn = document.querySelector('.history-btn-close');
const historyList = document.querySelector('.history-list');
const historyClearBtn = document.querySelector('.history-clear');
 
const HISTORY_KEY = 'calc_history_v1';
let historyItems = [];
try {
    historyItems = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
} catch (e) { historyItems = []; }
 
function renderHistory() {
    if (historyItems.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No history yet</p>';
        return;
    }
    historyList.innerHTML = historyItems.map((it, i) => `
        <div class="history-item" data-index="${i}" title="Click to copy result">
            <div class="history-expr">${it.expr}</div>
            <div class="history-result">${it.result}</div>
        </div>
    `).join('');
}
 
function addHistory(expr, result) {
    if (result === undefined || result === null || result === '') return;
    const strResult = String(result);
    if (strResult.startsWith('Cannot') || strResult.startsWith('Invalid') || strResult === 'NaN' || strResult === 'Result undefined') return;
    historyItems.unshift({ expr, result: strResult });
    if (historyItems.length > 50) historyItems = historyItems.slice(0, 50);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems)); } catch (e) {}
    renderHistory();
}
 
historyBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    historyPanel.classList.add('open');
});
historyCloseBtn.addEventListener('click', () => historyPanel.classList.remove('open'));
 
historyClearBtn.addEventListener('click', () => {
    historyItems = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    renderHistory();
});
 
historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const idx = parseInt(item.dataset.index, 10);
    const entry = historyItems[idx];
    if (!entry) return;
    // Copy result to clipboard and flash feedback
    navigator.clipboard?.writeText(entry.result).catch(() => {});
    const orig = item.style.background;
    item.style.background = 'rgba(236, 72, 153, 0.35)';
    setTimeout(() => { item.style.background = orig; }, 250);
});
 
renderHistory();
 
 
// -------- Mode switching --------
modeItems.forEach(item => {
    item.addEventListener('click', () => {
        const selectedMode = item.dataset.mode;
 
        modeItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
 
        modeName.textContent = item.textContent.trim();
 
        allModes.forEach(mode => mode.classList.remove('active'));
        const targetMode = document.querySelector(`.calc-mode[data-mode="${selectedMode}"]`);
        if (targetMode) targetMode.classList.add('active');
 
        sidebar.classList.remove('open');
    });
});
 
 
// ============================================
// SHARED HELPER FUNCTIONS
// ============================================
function formatNumber(num) {
    if (typeof num !== 'number') return String(num);
    if (!isFinite(num)) return 'Result undefined';
    return parseFloat(num.toPrecision(12)).toString();
}
 
function calculate(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b === 0) return 'Cannot divide by zero';
            return a / b;
        case '%': return a % b;
        case '^': return Math.pow(a, b);
        default: return b;
    }
}
 
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;   // JS max factorial before Infinity
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}
 
 
// ============================================
// STANDARD CALCULATOR
// ============================================
(function setupStandard() {
    const section = document.querySelector('.calc-mode[data-mode="standard"]');
    if (!section) return;
 
    let currentValue = '0';
    let previousValue = null;
    let operator = null;
    let shouldResetDisplay = false;
 
    const currentDisplay = section.querySelector('.current-value');
    const prevDisplay = section.querySelector('.prev-expr');
 
    const mathOpsMap = { '+': '+', '−': '-', '×': '*', '÷': '/' };
    const reverseOpsMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };
 
    function updateDisplay() { currentDisplay.textContent = currentValue; }
 
    function resetAll() {
        currentValue = '0';
        previousValue = null;
        operator = null;
        shouldResetDisplay = false;
        prevDisplay.textContent = '';
        updateDisplay();
    }
 
    // --- Number buttons ---
    section.querySelectorAll('.num').forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.textContent.trim();
            if (!/^[0-9]$/.test(digit)) return;
 
            if (shouldResetDisplay) {
                currentValue = digit;
                shouldResetDisplay = false;
            } else if (currentValue === '0') {
                currentValue = digit;
            } else {
                currentValue += digit;
            }
            updateDisplay();
        });
    });
 
    // --- Math operators (+, −, ×, ÷) with chaining ---
    section.querySelectorAll('.op').forEach(btn => {
        const symbol = btn.textContent.trim();
        if (!mathOpsMap[symbol]) return;
 
        btn.addEventListener('click', () => {
            if (operator !== null && previousValue !== null && !shouldResetDisplay) {
                const a = parseFloat(previousValue);
                const b = parseFloat(currentValue);
                const result = calculate(a, b, operator);
                currentValue = formatNumber(result);
                updateDisplay();
            }
            previousValue = currentValue;
            operator = mathOpsMap[symbol];
            shouldResetDisplay = true;
            prevDisplay.textContent = `${previousValue} ${symbol}`;
        });
    });
 
    // --- Equals ---
    section.querySelector('.equals').addEventListener('click', () => {
        if (operator === null || previousValue === null) return;
        const a = parseFloat(previousValue);
        const b = parseFloat(currentValue);
        const result = calculate(a, b, operator);
        const exprStr = `${previousValue} ${reverseOpsMap[operator]} ${currentValue}`;
        prevDisplay.textContent = `${exprStr} =`;
        currentValue = formatNumber(result);
        updateDisplay();
        addHistory(exprStr, currentValue);
        previousValue = null;
        operator = null;
        shouldResetDisplay = true;
    });
 
    // --- C, CE, ⌫ ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === 'C') {
            btn.addEventListener('click', resetAll);
        } else if (label === 'CE') {
            btn.addEventListener('click', () => { currentValue = '0'; updateDisplay(); });
        } else if (label === '⌫') {
            btn.addEventListener('click', () => {
                if (shouldResetDisplay) return;
                if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
                    currentValue = '0';
                } else {
                    currentValue = currentValue.slice(0, -1);
                }
                updateDisplay();
            });
        }
    });
 
    // --- Decimal ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '.') return;
        btn.addEventListener('click', () => {
            if (shouldResetDisplay) { currentValue = '0.'; shouldResetDisplay = false; }
            else if (!currentValue.includes('.')) { currentValue += '.'; }
            updateDisplay();
        });
    });
 
    // --- Sign toggle ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '±') return;
        btn.addEventListener('click', () => {
            if (currentValue === '0') return;
            currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : '-' + currentValue;
            updateDisplay();
        });
    });
 
    // --- Percentage ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '%') return;
        btn.addEventListener('click', () => {
            const current = parseFloat(currentValue);
            let result;
            if (previousValue !== null && operator !== null) {
                result = (parseFloat(previousValue) * current) / 100;
            } else {
                result = current / 100;
            }
            currentValue = formatNumber(result);
            updateDisplay();
        });
    });
 
    // --- Unary ops (x², √x, 1/x) ---
    section.querySelectorAll('.num, .op').forEach(btn => {
        const label = btn.textContent.trim();
        if (!['x²', '√x', '1/x'].includes(label)) return;
        btn.addEventListener('click', () => {
            const x = parseFloat(currentValue);
            let result, prevText;
            if (label === 'x²') { result = x * x; prevText = `sqr(${currentValue})`; }
            else if (label === '√x') {
                if (x < 0) { currentValue = 'Invalid input'; updateDisplay(); return; }
                result = Math.sqrt(x); prevText = `√(${currentValue})`;
            }
            else if (label === '1/x') {
                if (x === 0) { currentValue = 'Cannot divide by zero'; updateDisplay(); return; }
                result = 1 / x; prevText = `1/(${currentValue})`;
            }
            currentValue = formatNumber(result);
            prevDisplay.textContent = prevText;
            updateDisplay();
            shouldResetDisplay = true;
        });
    });
})();
 
 
// ============================================
// SCIENTIFIC CALCULATOR
// ============================================
(function setupScientific() {
    const section = document.querySelector('.calc-mode[data-mode="scientific"]');
    if (!section) return;
 
    let currentValue = '0';
    let previousValue = null;
    let operator = null;
    let shouldResetDisplay = false;
    let angleMode = 'DEG';     // DEG or RAD
    let secondMode = false;    // 2nd toggle for inverse trig etc
 
    const currentDisplay = section.querySelector('.current-value');
    const prevDisplay = section.querySelector('.prev-expr');
 
    const mathOpsMap = { '+': '+', '−': '-', '×': '*', '÷': '/', 'mod': '%', 'xʸ': '^' };
    const reverseOpsMap = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': 'mod', '^': '^' };
 
    function updateDisplay() { currentDisplay.textContent = currentValue; }
 
    function resetAll() {
        currentValue = '0';
        previousValue = null;
        operator = null;
        shouldResetDisplay = false;
        prevDisplay.textContent = '';
        updateDisplay();
    }
 
    function applyUnary(fn, label) {
        const x = parseFloat(currentValue);
        const result = fn(x);
        prevDisplay.textContent = `${label}(${currentValue})`;
        currentValue = formatNumber(result);
        updateDisplay();
        shouldResetDisplay = true;
    }
 
    function toRad(deg) { return deg * Math.PI / 180; }
    function toDeg(rad) { return rad * 180 / Math.PI; }
 
    // --- Number buttons ---
    section.querySelectorAll('.num').forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.textContent.trim();
            if (!/^[0-9]$/.test(digit)) return;
            if (shouldResetDisplay) { currentValue = digit; shouldResetDisplay = false; }
            else if (currentValue === '0') { currentValue = digit; }
            else { currentValue += digit; }
            updateDisplay();
        });
    });
 
    // --- Math operators including xʸ and mod ---
    section.querySelectorAll('.op').forEach(btn => {
        const symbol = btn.textContent.trim();
        if (!mathOpsMap[symbol]) return;
 
        btn.addEventListener('click', () => {
            if (operator !== null && previousValue !== null && !shouldResetDisplay) {
                const a = parseFloat(previousValue);
                const b = parseFloat(currentValue);
                const result = calculate(a, b, operator);
                currentValue = formatNumber(result);
                updateDisplay();
            }
            previousValue = currentValue;
            operator = mathOpsMap[symbol];
            shouldResetDisplay = true;
            prevDisplay.textContent = `${previousValue} ${symbol}`;
        });
    });
 
    // --- Equals ---
    section.querySelector('.equals').addEventListener('click', () => {
        if (operator === null || previousValue === null) return;
        const a = parseFloat(previousValue);
        const b = parseFloat(currentValue);
        const result = calculate(a, b, operator);
        const exprStr = `${previousValue} ${reverseOpsMap[operator]} ${currentValue}`;
        prevDisplay.textContent = `${exprStr} =`;
        currentValue = formatNumber(result);
        updateDisplay();
        addHistory(exprStr, currentValue);
        previousValue = null;
        operator = null;
        shouldResetDisplay = true;
    });
 
    // --- C, ⌫ ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === 'C') {
            btn.addEventListener('click', resetAll);
        } else if (label === '⌫') {
            btn.addEventListener('click', () => {
                if (shouldResetDisplay) return;
                if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
                    currentValue = '0';
                } else { currentValue = currentValue.slice(0, -1); }
                updateDisplay();
            });
        }
    });
 
    // --- Decimal ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '.') return;
        btn.addEventListener('click', () => {
            if (shouldResetDisplay) { currentValue = '0.'; shouldResetDisplay = false; }
            else if (!currentValue.includes('.')) { currentValue += '.'; }
            updateDisplay();
        });
    });
 
    // --- Sign toggle ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '±') return;
        btn.addEventListener('click', () => {
            if (currentValue === '0') return;
            currentValue = currentValue.startsWith('-') ? currentValue.slice(1) : '-' + currentValue;
            updateDisplay();
        });
    });
 
    // --- Constants π and e ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === 'π') {
            btn.addEventListener('click', () => {
                currentValue = formatNumber(Math.PI);
                updateDisplay();
                shouldResetDisplay = true;
            });
        } else if (label === 'e') {
            btn.addEventListener('click', () => {
                currentValue = formatNumber(Math.E);
                updateDisplay();
                shouldResetDisplay = true;
            });
        }
    });
 
    // --- Unary functions ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        switch (label) {
            case 'x²':
                btn.addEventListener('click', () => applyUnary(x => x * x, 'sqr'));
                break;
            case '√':
                btn.addEventListener('click', () => applyUnary(x => x < 0 ? NaN : Math.sqrt(x), '√'));
                break;
            case '1/x':
                btn.addEventListener('click', () => applyUnary(x => x === 0 ? NaN : 1 / x, '1/'));
                break;
            case '|x|':
                btn.addEventListener('click', () => applyUnary(Math.abs, 'abs'));
                break;
            case 'n!':
                btn.addEventListener('click', () => applyUnary(factorial, 'fact'));
                break;
            case '10ˣ':
                btn.addEventListener('click', () => applyUnary(x => Math.pow(10, x), '10^'));
                break;
            case 'exp':
                btn.addEventListener('click', () => applyUnary(Math.exp, 'e^'));
                break;
            case 'log':
                btn.addEventListener('click', () => applyUnary(x => x <= 0 ? NaN : Math.log10(x), 'log'));
                break;
            case 'ln':
                btn.addEventListener('click', () => applyUnary(x => x <= 0 ? NaN : Math.log(x), 'ln'));
                break;
            case 'sin':
                btn.addEventListener('click', () => {
                    if (secondMode) applyUnary(x => angleMode === 'DEG' ? toDeg(Math.asin(x)) : Math.asin(x), 'asin');
                    else applyUnary(x => Math.sin(angleMode === 'DEG' ? toRad(x) : x), 'sin');
                });
                break;
            case 'cos':
                btn.addEventListener('click', () => {
                    if (secondMode) applyUnary(x => angleMode === 'DEG' ? toDeg(Math.acos(x)) : Math.acos(x), 'acos');
                    else applyUnary(x => Math.cos(angleMode === 'DEG' ? toRad(x) : x), 'cos');
                });
                break;
            case 'tan':
                btn.addEventListener('click', () => {
                    if (secondMode) applyUnary(x => angleMode === 'DEG' ? toDeg(Math.atan(x)) : Math.atan(x), 'atan');
                    else applyUnary(x => Math.tan(angleMode === 'DEG' ? toRad(x) : x), 'tan');
                });
                break;
        }
    });
 
    // --- Mode toggles: 2nd, DEG, F-E ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === '2nd') {
            btn.addEventListener('click', () => {
                secondMode = !secondMode;
                btn.classList.toggle('active', secondMode);
                btn.style.background = secondMode ? '#4cc2ff' : '';
                btn.style.color = secondMode ? 'black' : '';
            });
        } else if (label === 'DEG') {
            btn.addEventListener('click', () => {
                angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
                btn.textContent = angleMode;
            });
        } else if (label === 'F-E') {
            btn.addEventListener('click', () => {
                // Toggle scientific vs decimal
                const x = parseFloat(currentValue);
                if (!isFinite(x)) return;
                if (currentValue.includes('e') || currentValue.includes('E')) {
                    currentValue = formatNumber(x);
                } else {
                    currentValue = x.toExponential(6);
                }
                updateDisplay();
            });
        }
    });
})();
 
 
// ============================================
// PROGRAMMER CALCULATOR
// ============================================
(function setupProgrammer() {
    const section = document.querySelector('.calc-mode[data-mode="programmer"]');
    if (!section) return;
 
    let currentValue = 0n;        // BigInt for accurate bitwise ops
    let previousValue = null;
    let operator = null;
    let shouldResetDisplay = false;
    let currentBase = 10;         // 10 DEC, 16 HEX, 8 OCT, 2 BIN
 
    const currentDisplay = section.querySelector('.current-value');
    const prevDisplay = section.querySelector('.prev-expr');
    const baseRows = section.querySelectorAll('.base-row');
    const baseValues = {
        HEX: section.querySelector('.base-row:nth-child(1) .base-value'),
        DEC: section.querySelector('.base-row:nth-child(2) .base-value'),
        OCT: section.querySelector('.base-row:nth-child(3) .base-value'),
        BIN: section.querySelector('.base-row:nth-child(4) .base-value')
    };
 
    const mathOpsMap = {
        '+': '+', '−': '-', '×': '*', '÷': '/', '%': '%',
        '<<': '<<', '>>': '>>',
        'AND': '&', 'OR': '|', 'XOR': '^', 'NAND': 'nand'
    };
    const reverseOpsMap = {
        '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%',
        '<<': '<<', '>>': '>>',
        '&': 'AND', '|': 'OR', '^': 'XOR', 'nand': 'NAND'
    };
 
    function toBase(val, base) {
        try {
            if (val < 0n) return '-' + (-val).toString(base).toUpperCase();
            return val.toString(base).toUpperCase();
        } catch (e) { return '0'; }
    }
 
    function updateDisplay() {
        currentDisplay.textContent = toBase(currentValue, currentBase);
        baseValues.HEX.textContent = toBase(currentValue, 16);
        baseValues.DEC.textContent = toBase(currentValue, 10);
        baseValues.OCT.textContent = toBase(currentValue, 8);
        baseValues.BIN.textContent = toBase(currentValue, 2);
    }
 
    function parseInBase(str, base) {
        try {
            if (!str || str === '-') return 0n;
            const neg = str.startsWith('-');
            const num = neg ? str.slice(1) : str;
            if (!num) return 0n;
            // BigInt only supports decimal literal; use base-specific parse
            let result = 0n;
            const bigBase = BigInt(base);
            for (const ch of num) {
                const d = parseInt(ch, base);
                if (isNaN(d)) return currentValue;
                result = result * bigBase + BigInt(d);
            }
            return neg ? -result : result;
        } catch (e) { return 0n; }
    }
 
    function calcProg(a, b, op) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b === 0n ? 0n : a / b;
            case '%': return b === 0n ? 0n : a % b;
            case '<<': return a << (b < 0n ? 0n : b);
            case '>>': return a >> (b < 0n ? 0n : b);
            case '&': return a & b;
            case '|': return a | b;
            case '^': return a ^ b;
            case 'nand': return ~(a & b);
            default: return b;
        }
    }
 
    function resetAll() {
        currentValue = 0n;
        previousValue = null;
        operator = null;
        shouldResetDisplay = false;
        prevDisplay.textContent = '';
        updateDisplay();
    }
 
    function canInputDigit(d) {
        const valid = '0123456789ABCDEF';
        const idx = valid.indexOf(d.toUpperCase());
        return idx >= 0 && idx < currentBase;
    }
 
    function inputDigit(d) {
        if (!canInputDigit(d)) return;
        let current = toBase(currentValue, currentBase);
        if (shouldResetDisplay) {
            current = d;
            shouldResetDisplay = false;
        } else if (current === '0') {
            current = d;
        } else {
            current += d;
        }
        currentValue = parseInBase(current, currentBase);
        updateDisplay();
    }
 
    // --- Base switching (click HEX/DEC/OCT/BIN row) ---
    baseRows.forEach((row, idx) => {
        row.addEventListener('click', () => {
            const bases = [16, 10, 8, 2];
            currentBase = bases[idx];
            baseRows.forEach(r => r.classList.remove('active'));
            row.classList.add('active');
            updateDisplay();
        });
    });
 
    // --- Number buttons (0-9) and hex letters (A-F) ---
    section.querySelectorAll('.num, .op').forEach(btn => {
        const label = btn.textContent.trim();
        if (/^[0-9A-F]$/.test(label)) {
            btn.addEventListener('click', () => inputDigit(label));
        }
    });
 
    // --- Math operators with chaining ---
    section.querySelectorAll('.op').forEach(btn => {
        const symbol = btn.textContent.trim();
        if (!mathOpsMap[symbol]) return;
 
        btn.addEventListener('click', () => {
            if (operator !== null && previousValue !== null && !shouldResetDisplay) {
                const result = calcProg(previousValue, currentValue, operator);
                currentValue = result;
                updateDisplay();
            }
            previousValue = currentValue;
            operator = mathOpsMap[symbol];
            shouldResetDisplay = true;
            prevDisplay.textContent = `${toBase(previousValue, currentBase)} ${symbol}`;
        });
    });
 
    // --- Equals ---
    section.querySelector('.equals').addEventListener('click', () => {
        if (operator === null || previousValue === null) return;
        const result = calcProg(previousValue, currentValue, operator);
        const exprStr = `${toBase(previousValue, currentBase)} ${reverseOpsMap[operator]} ${toBase(currentValue, currentBase)}`;
        prevDisplay.textContent = `${exprStr} =`;
        currentValue = result;
        updateDisplay();
        addHistory(exprStr, toBase(result, currentBase));
        previousValue = null;
        operator = null;
        shouldResetDisplay = true;
    });
 
    // --- NOT (unary) ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== 'NOT') return;
        btn.addEventListener('click', () => {
            prevDisplay.textContent = `NOT(${toBase(currentValue, currentBase)})`;
            currentValue = ~currentValue;
            updateDisplay();
            shouldResetDisplay = true;
        });
    });
 
    // --- C, ⌫ (handle both C buttons — there are 2 in HTML) ---
    section.querySelectorAll('.op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === 'C') {
            btn.addEventListener('click', resetAll);
        } else if (label === '⌫') {
            btn.addEventListener('click', () => {
                if (shouldResetDisplay) return;
                let current = toBase(currentValue, currentBase);
                if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
                    currentValue = 0n;
                } else {
                    current = current.slice(0, -1);
                    currentValue = parseInBase(current, currentBase);
                }
                updateDisplay();
            });
        }
    });
 
    // --- Sign toggle (±) ---
    section.querySelectorAll('.op').forEach(btn => {
        if (btn.textContent.trim() !== '±') return;
        btn.addEventListener('click', () => {
            if (currentValue === 0n) return;
            currentValue = -currentValue;
            updateDisplay();
        });
    });
 
    updateDisplay();
})();
 
 
// ============================================
// DATE CALCULATION
// ============================================
(function setupDate() {
    const section = document.querySelector('.calc-mode[data-mode="date"]');
    if (!section) return;
 
    const operationSelect = section.querySelector('.date-operation');
    const fromInput = section.querySelector('.date-from');
    const toInput = section.querySelector('.date-to');
    const resultLabel = section.querySelector('.date-result-label');
    const resultValue = section.querySelector('.date-result-value');
 
    // Set defaults: today
    const today = new Date().toISOString().split('T')[0];
    fromInput.value = today;
    toInput.value = today;
 
    function computeDiff() {
        if (!fromInput.value || !toInput.value) {
            resultValue.textContent = '0 days';
            return;
        }
        const from = new Date(fromInput.value);
        const to = new Date(toInput.value);
        const msPerDay = 1000 * 60 * 60 * 24;
        const diffMs = to - from;
        const diffDays = Math.round(diffMs / msPerDay);
 
        if (isNaN(diffDays)) {
            resultValue.textContent = '—';
            return;
        }
 
        // Compute years, months, days breakdown
        let years = to.getFullYear() - from.getFullYear();
        let months = to.getMonth() - from.getMonth();
        let days = to.getDate() - from.getDate();
 
        if (days < 0) {
            months--;
            const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) { years--; months += 12; }
 
        const absDays = Math.abs(diffDays);
        const sign = diffDays < 0 ? '-' : '';
        let breakdown = '';
        if (years || months) {
            const parts = [];
            if (Math.abs(years)) parts.push(`${Math.abs(years)} year${Math.abs(years) > 1 ? 's' : ''}`);
            if (Math.abs(months)) parts.push(`${Math.abs(months)} month${Math.abs(months) > 1 ? 's' : ''}`);
            if (Math.abs(days)) parts.push(`${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`);
            breakdown = ` (${sign}${parts.join(', ')})`;
        }
 
        resultLabel.textContent = 'Difference';
        resultValue.textContent = `${sign}${absDays} day${absDays !== 1 ? 's' : ''}${breakdown}`;
    }
 
    function computeAddSubtract() {
        // For this mode, interpret 'to' date as target after add/subtract.
        // Simpler: show days diff from 'from' date.
        // Full add/subtract needs a number input which HTML doesn't have.
        // Fallback: compute as difference.
        computeDiff();
    }
 
    function recompute() {
        const op = operationSelect.value;
        if (op === 'Difference between dates') computeDiff();
        else computeAddSubtract();
    }
 
    operationSelect.addEventListener('change', recompute);
    fromInput.addEventListener('change', recompute);
    toInput.addEventListener('change', recompute);
 
    recompute();
})();
 
 
// ============================================
// CONVERTERS (Length, Weight, Volume, etc.)
// ============================================
 
// -------- Conversion tables (base unit approach) --------
// For each converter: factor to convert FROM this unit TO the base unit.
// To convert A → B: value * factor[A] / factor[B]
const CONVERSION_FACTORS = {
    volume: {
        // base: Liter
        'Milliliter': 0.001,
        'Liter': 1,
        'Cubic Meter': 1000,
        'Teaspoon (US)': 0.00492892,
        'Tablespoon (US)': 0.0147868,
        'Fluid Ounce (US)': 0.0295735,
        'Cup (US)': 0.236588,
        'Pint (US)': 0.473176,
        'Quart (US)': 0.946353,
        'Gallon (US)': 3.78541,
        'Cubic Inch': 0.0163871,
        'Cubic Foot': 28.3168
    },
    length: {
        // base: Meter
        'Millimeter': 0.001,
        'Centimeter': 0.01,
        'Meter': 1,
        'Kilometer': 1000,
        'Inch': 0.0254,
        'Foot': 0.3048,
        'Yard': 0.9144,
        'Mile': 1609.344,
        'Nautical Mile': 1852
    },
    weight: {
        // base: Kilogram
        'Milligram': 0.000001,
        'Gram': 0.001,
        'Kilogram': 1,
        'Tonne (Metric)': 1000,
        'Carat': 0.0002,
        'Ounce': 0.0283495,
        'Pound': 0.453592,
        'Stone': 6.35029,
        'Short Ton (US)': 907.185,
        'Long Ton (UK)': 1016.05
    },
    energy: {
        // base: Joule
        'Electron Volt': 1.602176634e-19,
        'Joule': 1,
        'Kilojoule': 1000,
        'Thermal Calorie': 4.184,
        'Food Calorie': 4184,
        'Foot-pound': 1.35582,
        'British Thermal Unit': 1055.06
    },
    area: {
        // base: Square Meter
        'Square Millimeter': 0.000001,
        'Square Centimeter': 0.0001,
        'Square Meter': 1,
        'Hectare': 10000,
        'Square Kilometer': 1e6,
        'Square Inch': 0.00064516,
        'Square Foot': 0.092903,
        'Square Yard': 0.836127,
        'Acre': 4046.86,
        'Square Mile': 2.59e6
    },
    speed: {
        // base: Meter per second
        'Centimeter per second': 0.01,
        'Meter per second': 1,
        'Kilometer per hour': 0.277778,
        'Foot per second': 0.3048,
        'Mile per hour': 0.44704,
        'Knot': 0.514444,
        'Mach (at Sea Level)': 340.29
    },
    time: {
        // base: Second
        'Microsecond': 0.000001,
        'Millisecond': 0.001,
        'Second': 1,
        'Minute': 60,
        'Hour': 3600,
        'Day': 86400,
        'Week': 604800,
        'Year': 31557600
    },
    power: {
        // base: Watt
        'Watt': 1,
        'Kilowatt': 1000,
        'Megawatt': 1e6,
        'Horsepower': 745.7,
        'Foot-pound per minute': 0.0225969,
        'BTU per minute': 17.5843
    },
    data: {
        // base: Bit (binary prefix 1 KB = 1024 bytes)
        'Bit': 1,
        'Byte': 8,
        'Kilobit': 1000,
        'Kilobyte': 8000,
        'Megabit': 1e6,
        'Megabyte': 8e6,
        'Gigabit': 1e9,
        'Gigabyte': 8e9,
        'Terabit': 1e12,
        'Terabyte': 8e12,
        'Petabit': 1e15,
        'Petabyte': 8e15
    },
    pressure: {
        // base: Pascal
        'Atmosphere': 101325,
        'Bar': 100000,
        'Kilopascal': 1000,
        'Millimeter of Mercury': 133.322,
        'Pascal': 1,
        'PSI (Pound per Square Inch)': 6894.76
    },
    angle: {
        // base: Degree
        'Degrees': 1,
        'Radians': 57.2958,
        'Gradians': 0.9
    },
    // Static currency rates (relative to USD base). Update manually.
    currency: {
        'USD — US Dollar': 1,
        'EUR — Euro': 0.92,
        'GBP — British Pound': 0.79,
        'JPY — Japanese Yen': 155.0,
        'PKR — Pakistani Rupee': 278.0,
        'INR — Indian Rupee': 83.0,
        'CAD — Canadian Dollar': 1.37,
        'AUD — Australian Dollar': 1.52,
        'CNY — Chinese Yuan': 7.24,
        'AED — UAE Dirham': 3.67,
        'SAR — Saudi Riyal': 3.75
    }
};
 
// -------- Temperature (non-linear, custom) --------
function tempToCelsius(value, fromUnit) {
    switch (fromUnit) {
        case 'Celsius': return value;
        case 'Fahrenheit': return (value - 32) * 5 / 9;
        case 'Kelvin': return value - 273.15;
        default: return value;
    }
}
function celsiusToUnit(value, toUnit) {
    switch (toUnit) {
        case 'Celsius': return value;
        case 'Fahrenheit': return value * 9 / 5 + 32;
        case 'Kelvin': return value + 273.15;
        default: return value;
    }
}
 
// -------- Generic converter factory --------
function setupConverter(mode) {
    const section = document.querySelector(`.calc-mode[data-mode="${mode}"]`);
    if (!section) return;
 
    const fromInput = section.querySelector('.conv-from-value');
    const toInput = section.querySelector('.conv-to-value');
    const fromSelect = section.querySelector('.conv-from-unit');
    const toSelect = section.querySelector('.conv-to-unit');
 
    let activeField = 'from';   // which field the number pad types into
 
    function convertValue(value, fromUnit, toUnit) {
        if (mode === 'temperature') {
            const celsius = tempToCelsius(value, fromUnit);
            return celsiusToUnit(celsius, toUnit);
        }
        const table = CONVERSION_FACTORS[mode];
        if (!table || !(fromUnit in table) || !(toUnit in table)) return value;
        const baseValue = value * table[fromUnit];
        return baseValue / table[toUnit];
    }
 
    function formatConv(n) {
        if (!isFinite(n)) return '—';
        if (n === 0) return '0';
        const abs = Math.abs(n);
        if (abs >= 1e15 || abs < 1e-6) return n.toExponential(4);
        return parseFloat(n.toPrecision(10)).toString();
    }
 
    function recompute(source) {
        // source: 'from' or 'to' — which side was edited
        const fromVal = parseFloat(fromInput.value) || 0;
        const toVal = parseFloat(toInput.value) || 0;
        const fromUnit = fromSelect.value;
        const toUnit = toSelect.value;
 
        if (source === 'from') {
            const result = convertValue(fromVal, fromUnit, toUnit);
            toInput.value = formatConv(result);
        } else {
            const result = convertValue(toVal, toUnit, fromUnit);
            fromInput.value = formatConv(result);
        }
    }
 
    // --- Input listeners ---
    fromInput.addEventListener('input', () => { activeField = 'from'; recompute('from'); });
    toInput.addEventListener('input', () => { activeField = 'to'; recompute('to'); });
    fromInput.addEventListener('focus', () => { activeField = 'from'; });
    toInput.addEventListener('focus', () => { activeField = 'to'; });
 
    fromSelect.addEventListener('change', () => recompute(activeField));
    toSelect.addEventListener('change', () => recompute(activeField));
 
    // --- Number pad ---
    section.querySelectorAll('.conv-buttons .num').forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.textContent.trim();
            if (!/^[0-9]$/.test(digit)) return;
            const target = activeField === 'from' ? fromInput : toInput;
            if (target.value === '0' || target.value === '') target.value = digit;
            else target.value += digit;
            recompute(activeField);
        });
    });
 
    section.querySelectorAll('.conv-buttons .op').forEach(btn => {
        const label = btn.textContent.trim();
        if (label === '') return;  // empty placeholder
        const target = () => activeField === 'from' ? fromInput : toInput;
 
        if (label === '⌫') {
            btn.addEventListener('click', () => {
                const t = target();
                if (t.value.length <= 1) t.value = '0';
                else t.value = t.value.slice(0, -1);
                recompute(activeField);
            });
        } else if (label === 'C') {
            btn.addEventListener('click', () => {
                fromInput.value = '0';
                toInput.value = '0';
                recompute('from');
            });
        } else if (label === '±') {
            btn.addEventListener('click', () => {
                const t = target();
                const v = parseFloat(t.value) || 0;
                t.value = (-v).toString();
                recompute(activeField);
            });
        } else if (label === '.') {
            btn.addEventListener('click', () => {
                const t = target();
                if (!t.value.includes('.')) t.value = (t.value || '0') + '.';
            });
        }
    });
 
    // Initial compute
    recompute('from');
}
 
// Setup all 13 converters
['currency', 'volume', 'length', 'weight', 'temperature', 'energy', 'area',
 'speed', 'time', 'power', 'data', 'pressure', 'angle'].forEach(setupConverter);
 



