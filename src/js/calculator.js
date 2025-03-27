document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const calculator = document.querySelector('.calculator');
    const display = document.querySelector('.calculator-display');
    const expressionDisplay = document.querySelector('.calculator-expression');
    const binaryDisplay = document.querySelector('.binary-representation');
    const numSystemSelect = document.getElementById('num-system');
    const bitWidthSelect = document.getElementById('bit-width');
    const signedRadio = document.getElementById('signed');
    const unsignedRadio = document.getElementById('unsigned');
    const buttons = document.querySelectorAll('.btn');
    const hexKeys = document.querySelectorAll('.hex-key');

    // 计算器状态
    const state = {
        displayValue: '0',
        firstOperand: null,
        waitingForSecondOperand: false,
        operator: null,
        numSystem: 10,
        bitWidth: 32,
        isSigned: true,
        expression: '',
    };

    // 更新显示内容
    function updateDisplay() {
        // 显示值应包含进制前缀（如0x、0b等）
        display.textContent = formatDisplayValue();
        
        // 更新二进制表示
        updateBinaryRepresentation();
        
        // 更新表达式显示
        expressionDisplay.textContent = state.expression;
    }

    // 格式化显示值
    function formatDisplayValue() {
        let value = state.displayValue;
        
        // 如果是十六进制，转换为大写并添加0x前缀
        if (state.numSystem === 16) {
            return '0x' + value.toUpperCase();
        }
        
        // 如果是二进制，添加0b前缀
        if (state.numSystem === 2) {
            return '0b' + value;
        }
        
        // 如果是八进制，添加0前缀
        if (state.numSystem === 8) {
            return '0' + value;
        }
        
        return value;
    }

    // 更新二进制表示
    function updateBinaryRepresentation() {
        const decimalValue = parseInt(state.displayValue, state.numSystem);
        if (isNaN(decimalValue)) {
            binaryDisplay.textContent = '';
            return;
        }

        let binaryStr = '';
        const bitWidth = state.bitWidth;
        
        // 根据位宽和符号类型计算二进制表示
        if (state.isSigned) {
            if (decimalValue < 0) {
                // 有符号负数的补码表示
                if (bitWidth <= 32) {
                    // 对于32位及以下可以使用JavaScript内置的位运算
                    // 用掩码限制位数
                    const twosComplement = decimalValue >>> 0; // 转为32位无符号整数的补码表示
                    // 提取我们需要的位数
                    const mask = (1 << bitWidth) - 1;
                    const limitedValue = twosComplement & mask;
                    binaryStr = limitedValue.toString(2).padStart(bitWidth, '0');
                } else {
                    // 64位处理（JavaScript位运算限制在32位内）
                    // 手动计算补码：取绝对值，按位取反，再加1
                    let value = Math.abs(decimalValue);
                    let bits = value.toString(2).padStart(bitWidth - 1, '0');
                    
                    // 取反
                    let inverted = '';
                    for (let i = 0; i < bits.length; i++) {
                        inverted += bits[i] === '0' ? '1' : '0';
                    }
                    
                    // 加1得到补码
                    let carry = 1;
                    let result = '';
                    for (let i = inverted.length - 1; i >= 0; i--) {
                        let sum = parseInt(inverted[i]) + carry;
                        if (sum === 2) {
                            result = '0' + result;
                            carry = 1;
                        } else {
                            result = sum + result;
                            carry = 0;
                        }
                    }
                    
                    binaryStr = '1' + result; // 添加符号位
                }
            } else {
                // 有符号正数的二进制表示
                binaryStr = decimalValue.toString(2).padStart(bitWidth, '0');
            }
        } else {
            // 无符号数的二进制表示
            const mask = (1 << bitWidth) - 1;
            binaryStr = (decimalValue & mask).toString(2).padStart(bitWidth, '0');
        }
        
        // 分组显示二进制位
        let formattedBinary = '';
        for (let i = 0; i < binaryStr.length; i++) {
            formattedBinary += binaryStr[i];
            if ((i + 1) % 4 === 0 && i !== binaryStr.length - 1) {
                formattedBinary += ' ';
            }
        }
        
        binaryDisplay.textContent = formattedBinary;
    }

    // 输入数字
    function inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = state;

        if (waitingForSecondOperand) {
            state.displayValue = String(digit);
            state.waitingForSecondOperand = false;
            state.expression += digit;
        } else {
            state.displayValue = displayValue === '0' ? String(digit) : displayValue + digit;
            if (state.expression === '' || state.expression === '0') {
                state.expression = String(digit);
            } else if (!state.operator || state.operator === '=') {
                state.expression = displayValue === '0' ? String(digit) : state.expression + digit;
            } else {
                state.expression += digit;
            }
        }

        // 检查位宽限制
        applyBitWidthLimit();
    }

    // 应用当前位宽限制
    function applyBitWidthLimit() {
        const decimalValue = parseInt(state.displayValue, state.numSystem);
        if (isNaN(decimalValue)) return;

        const bitWidth = state.bitWidth;
        let result;

        if (state.isSigned) {
            // 有符号数的范围限制
            const maxValue = (1 << (bitWidth - 1)) - 1;
            const minValue = -(1 << (bitWidth - 1));
            
            // 检查是否超出有符号正数范围但在无符号范围内（即最高位为1的情况）
            const highBitMask = 1 << (bitWidth - 1);
            if (decimalValue >= 0 && (decimalValue & highBitMask) !== 0) {
                // 计算对应的有符号表示（负数）
                const signedValue = decimalValue - (1 << bitWidth);
                // 保持原始的displayValue，但更新expression为有符号表示
                state.expression = signedValue.toString(state.numSystem);
                return; // 直接返回，不修改displayValue
            }
            
            result = Math.max(minValue, Math.min(maxValue, decimalValue));
        } else {
            // 无符号数的范围限制
            const maxValue = (1 << bitWidth) - 1;
            result = decimalValue & maxValue;
        }

        state.displayValue = result.toString(state.numSystem);
    }

    // 输入小数点
    function inputDecimalPoint() {
        if (state.waitingForSecondOperand) {
            state.displayValue = '0.';
            state.waitingForSecondOperand = false;
            state.expression += '0.';
            return;
        }

        if (!state.displayValue.includes('.')) {
            state.displayValue += '.';
            state.expression += '.';
        }
    }

    // 处理运算符
    function handleOperator(nextOperator) {
        const { firstOperand, displayValue, operator } = state;
        const inputValue = parseInt(displayValue, state.numSystem);

        if (firstOperand === null) {
            state.firstOperand = inputValue;
        } else if (operator && !state.waitingForSecondOperand) {
            const result = performCalculation();
            state.displayValue = result.toString(state.numSystem);
            state.firstOperand = result;
            
            if (nextOperator === '=') {
                state.expression = result.toString(state.numSystem);
            } else {
                state.expression = result.toString(state.numSystem) + ' ' + getOperatorSymbol(nextOperator) + ' ';
            }
        }

        state.waitingForSecondOperand = true;
        state.operator = nextOperator;
        
        if (nextOperator !== '=' && nextOperator !== null) {
            if (state.expression.endsWith(' ' + getOperatorSymbol(operator) + ' ')) {
                // 替换表达式中的上一个运算符
                state.expression = state.expression.slice(0, -3) + ' ' + getOperatorSymbol(nextOperator) + ' ';
            } else if (!state.expression.includes(getOperatorSymbol(nextOperator))) {
                state.expression += ' ' + getOperatorSymbol(nextOperator) + ' ';
            }
        }
    }

    // 获取运算符符号
    function getOperatorSymbol(operator) {
        const operatorSymbols = {
            'add': '+',
            'subtract': '-',
            'multiply': '×',
            'divide': '÷',
            'and': '&',
            'or': '|',
            'xor': '^',
            'not': '~',
            'lsh': '<<',
            'rsh': '>>',
            'mod': '%',
            'rol': 'RoL',
            'ror': 'RoR',
            'equals': '='
        };
        
        return operatorSymbols[operator] || operator;
    }

    // 执行计算
    function performCalculation() {
        const { firstOperand, operator, displayValue } = state;
        const secondOperand = parseInt(displayValue, state.numSystem);
        
        if (isNaN(firstOperand) || isNaN(secondOperand)) {
            return 0;
        }
        
        let result = 0;
        
        switch (operator) {
            case 'add':
                result = firstOperand + secondOperand;
                break;
            case 'subtract':
                result = firstOperand - secondOperand;
                break;
            case 'multiply':
                result = firstOperand * secondOperand;
                break;
            case 'divide':
                result = secondOperand !== 0 ? Math.floor(firstOperand / secondOperand) : 0;
                break;
            case 'and':
                result = firstOperand & secondOperand;
                break;
            case 'or':
                result = firstOperand | secondOperand;
                break;
            case 'xor':
                result = firstOperand ^ secondOperand;
                break;
            case 'lsh':
                result = firstOperand << secondOperand;
                break;
            case 'rsh':
                result = state.isSigned ? 
                        (firstOperand >> secondOperand) : 
                        (firstOperand >>> secondOperand);
                break;
            case 'mod':
                result = firstOperand % secondOperand;
                break;
            case 'rol':
                result = bitwiseRotateLeft(firstOperand, secondOperand);
                break;
            case 'ror':
                result = bitwiseRotateRight(firstOperand, secondOperand);
                break;
            default:
                return secondOperand;
        }
        
        // 应用位宽限制
        return applyLimits(result);
    }
    
    // 执行一元操作
    function performUnaryOperation(operation) {
        const inputValue = parseInt(state.displayValue, state.numSystem);
        let result = 0;
        
        switch (operation) {
            case 'not':
                result = ~inputValue;
                state.expression = '~' + state.displayValue;
                break;
            case 'neg':
                result = -inputValue;
                state.expression = '-' + state.displayValue;
                break;
            default:
                return;
        }
        
        state.displayValue = applyLimits(result).toString(state.numSystem);
        state.firstOperand = null;
        state.waitingForSecondOperand = false;
        state.operator = null;
    }
    
    // 位旋转操作（循环左移）
    function bitwiseRotateLeft(value, shift) {
        const bitWidth = state.bitWidth;
        shift = shift % bitWidth;
        
        // 创建掩码
        const mask = (1 << bitWidth) - 1;
        
        // 将数值限制在当前位宽内
        value &= mask;
        
        // 执行循环左移
        return ((value << shift) | (value >>> (bitWidth - shift))) & mask;
    }
    
    // 位旋转操作（循环右移）
    function bitwiseRotateRight(value, shift) {
        const bitWidth = state.bitWidth;
        shift = shift % bitWidth;
        
        // 创建掩码
        const mask = (1 << bitWidth) - 1;
        
        // 将数值限制在当前位宽内
        value &= mask;
        
        // 执行循环右移
        return ((value >>> shift) | (value << (bitWidth - shift))) & mask;
    }
    
    // 应用位宽和符号限制
    function applyLimits(value) {
        const bitWidth = state.bitWidth;
        
        if (state.isSigned) {
            // 有符号数的范围限制
            const maxValue = (1 << (bitWidth - 1)) - 1;
            const minValue = -(1 << (bitWidth - 1));
            return Math.max(minValue, Math.min(maxValue, value));
        } else {
            // 无符号数的范围限制
            const mask = (1 << bitWidth) - 1;
            return value & mask;
        }
    }

    // 重置计算器
    function resetCalculator() {
        state.displayValue = '0';
        state.firstOperand = null;
        state.waitingForSecondOperand = false;
        state.operator = null;
        state.expression = '';
        updateDisplay();
    }

    // 处理退格操作
    function handleBackspace() {
        if (state.waitingForSecondOperand) {
            return;
        }
        
        if (state.displayValue.length > 1) {
            state.displayValue = state.displayValue.slice(0, -1);
            if (state.expression.endsWith(state.displayValue + 1)) {
                state.expression = state.expression.slice(0, -1);
            }
        } else {
            state.displayValue = '0';
            if (!state.expression.includes(' ')) {
                state.expression = '0';
            }
        }
    }

    // 切换数字系统
    function changeNumberSystem(newSystem) {
        if (newSystem === state.numSystem) {
            return;
        }
        
        // 将当前显示值转换为十进制
        const decimalValue = parseInt(state.displayValue, state.numSystem);
        
        // 更新状态
        state.numSystem = newSystem;
        
        // 将十进制值转换为新数字系统的字符串
        state.displayValue = isNaN(decimalValue) ? '0' : decimalValue.toString(newSystem);
        
        // 更新表达式显示
        if (state.expression === '' || (!state.operator || state.operator === '=')) {
            // 如果没有运算符或者刚完成计算，直接更新整个表达式
            state.expression = state.displayValue;
        } else if (state.waitingForSecondOperand) {
            // 如果正在等待第二个操作数，更新表达式中的第一部分
            const parts = state.expression.split(' ');
            if (parts.length >= 1) {
                parts[0] = state.displayValue;
                state.expression = parts.join(' ');
            }
        } else {
            // 如果正在输入第二个操作数，更新表达式中的最后部分
            const parts = state.expression.split(' ');
            if (parts.length >= 3) {
                parts[parts.length - 1] = state.displayValue;
                state.expression = parts.join(' ');
            } else {
                // 如果表达式格式不正确，直接更新
                state.expression = state.displayValue;
            }
        }
        
        // 更新十六进制按键的启用状态
        updateHexKeysState();
        
        // 根据数字系统设置计算器类名
        calculator.className = 'calculator';
        if (newSystem === 16) {
            calculator.classList.add('hex');
        } else if (newSystem === 10) {
            calculator.classList.add('dec');
        } else if (newSystem === 2) {
            calculator.classList.add('bin');
        } else if (newSystem === 8) {
            calculator.classList.add('oct');
        }
        
        // 更新显示
        updateDisplay();
    }
    
    // 更新十六进制按键状态
    function updateHexKeysState() {
        hexKeys.forEach(key => {
            const value = key.textContent.toLowerCase();
            const isHex = state.numSystem === 16;
            const isValidForCurrentSystem = isHex;
            
            key.disabled = !isValidForCurrentSystem;
            key.classList.toggle('enabled', isValidForCurrentSystem);
        });
    }
    
    // 切换位宽
    function changeBitWidth(newWidth) {
        state.bitWidth = parseInt(newWidth);
        applyBitWidthLimit();
        updateDisplay();
    }
    
    // 切换符号模式
    function toggleSignMode(isSigned) {
        const oldSigned = state.isSigned;
        state.isSigned = isSigned;
        
        // 如果数值和符号模式有变化，需要进行转换
        if (oldSigned !== isSigned) {
            const decimalValue = parseInt(state.displayValue, state.numSystem);
            if (!isNaN(decimalValue)) {
                const bitWidth = state.bitWidth;
                
                // 从无符号切换到有符号
                if (isSigned) {
                    // 检查最高位，如果为1（负数形式）则转换为负数
                    const highBitMask = 1 << (bitWidth - 1);
                    
                    if ((decimalValue & highBitMask) !== 0) {
                        // 高位为1，表示负数
                        let signedValue;
                        
                        // 计算二进制补码对应的负数值
                        if (bitWidth <= 32) {
                            // 对于32位以下的数，可以直接计算补码
                            // 获取补码的"原值"，然后转成负数
                            signedValue = decimalValue - (1 << bitWidth);
                        } else {
                            // 64位处理，手动计算补码
                            const negativeMask = (1 << bitWidth) - 1;
                            signedValue = -((~decimalValue & negativeMask) + 1);
                        }
                        
                        // 只更新表达式值为负数形式，而不改变displayValue
                        // 这样display.textContent会显示原始的十六进制值
                        // 而expressionDisplay.textContent会显示转换后的有符号负数
                        state.expression = signedValue.toString(state.numSystem);
                        
                        // 立即更新显示并退出
                        updateDisplay();
                        return;
                    } else {
                        // 最高位为0，确保expression和displayValue一致
                        state.expression = state.displayValue;
                    }
                } 
                // 从有符号切换到无符号
                else if (decimalValue < 0) {
                    // 负数转换为对应的无符号值（补码表示）
                    let unsignedValue;
                    
                    if (bitWidth <= 32) {
                        // 对于32位以下的数，可以直接计算补码
                        unsignedValue = (1 << bitWidth) + decimalValue;
                    } else {
                        // 64位处理，手动计算补码
                        // 首先取绝对值
                        const absValue = Math.abs(decimalValue);
                        // 然后取反加1
                        const inverted = ((1 << bitWidth) - 1) & (~absValue);
                        unsignedValue = inverted + 1;
                    }
                    
                    // 更新显示值和表达式为补码形式
                    state.displayValue = unsignedValue.toString(state.numSystem);
                    state.expression = state.displayValue;
                    
                    // 立即更新显示并退出
                    updateDisplay();
                    return;
                } else {
                    // 从有符号切换到无符号，但值是正数
                    // 确保expression和displayValue一致
                    state.expression = state.displayValue;
                }
            }
        }
        
        // 应用位宽限制并更新显示
        applyBitWidthLimit();
        updateDisplay();
    }

    // 数字按钮事件监听
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // 数字按键
            if (button.classList.contains('digit')) {
                const digit = button.textContent;
                // 检查当前数字系统是否支持该数字
                if (parseInt(digit) < state.numSystem) {
                    inputDigit(digit);
                    updateDisplay();
                }
                return;
            }
            
            // 十六进制按键
            if (button.classList.contains('hex-key') && !button.disabled) {
                const digit = button.textContent.toLowerCase();
                inputDigit(digit);
                updateDisplay();
                return;
            }
            
            // 特殊操作
            const action = button.dataset.action;
            if (!action) return;
            
            switch (action) {
                case 'clear':
                    resetCalculator();
                    break;
                case 'backspace':
                    handleBackspace();
                    updateDisplay();
                    break;
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                case 'mod':
                case 'and':
                case 'or':
                case 'xor':
                case 'lsh':
                case 'rsh':
                case 'rol':
                case 'ror':
                case 'equals':
                    handleOperator(action);
                    updateDisplay();
                    break;
                case 'not':
                case 'neg':
                    performUnaryOperation(action);
                    updateDisplay();
                    break;
            }
        });
    });

    // 数字系统选择器事件监听
    numSystemSelect.addEventListener('change', () => {
        changeNumberSystem(parseInt(numSystemSelect.value));
    });
    
    // 位宽选择器事件监听
    bitWidthSelect.addEventListener('change', () => {
        changeBitWidth(bitWidthSelect.value);
    });
    
    // 符号模式切换事件监听
    signedRadio.addEventListener('change', () => {
        if (signedRadio.checked) {
            toggleSignMode(true);
        }
    });
    
    unsignedRadio.addEventListener('change', () => {
        if (unsignedRadio.checked) {
            toggleSignMode(false);
        }
    });
    
    // 初始化计算器
    updateHexKeysState();
    updateDisplay();
    
    // 添加键盘支持
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        
        // 数字键
        if (/^[0-9]$/.test(key)) {
            if (parseInt(key) < state.numSystem) {
                inputDigit(key);
                updateDisplay();
            }
            event.preventDefault();
        }
        
        // 十六进制键
        if (/^[a-f]$/i.test(key) && state.numSystem === 16) {
            inputDigit(key.toLowerCase());
            updateDisplay();
            event.preventDefault();
        }
        
        // 操作键
        switch (key) {
            case '+':
                handleOperator('add');
                updateDisplay();
                event.preventDefault();
                break;
            case '-':
                handleOperator('subtract');
                updateDisplay();
                event.preventDefault();
                break;
            case '*':
                handleOperator('multiply');
                updateDisplay();
                event.preventDefault();
                break;
            case '/':
                handleOperator('divide');
                updateDisplay();
                event.preventDefault();
                break;
            case '%':
                handleOperator('mod');
                updateDisplay();
                event.preventDefault();
                break;
            case '&':
                handleOperator('and');
                updateDisplay();
                event.preventDefault();
                break;
            case '|':
                handleOperator('or');
                updateDisplay();
                event.preventDefault();
                break;
            case '^':
                handleOperator('xor');
                updateDisplay();
                event.preventDefault();
                break;
            case '=':
            case 'Enter':
                handleOperator('equals');
                updateDisplay();
                event.preventDefault();
                break;
            case 'Backspace':
                handleBackspace();
                updateDisplay();
                event.preventDefault();
                break;
            case 'Escape':
                resetCalculator();
                event.preventDefault();
                break;
            case '~':
                performUnaryOperation('not');
                updateDisplay();
                event.preventDefault();
                break;
        }
    });
}); 