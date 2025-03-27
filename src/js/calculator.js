document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const calculator = document.querySelector('.calculator');
    const display = document.querySelector('.calculator-display');
    const hexDisplay = document.querySelector('.hex-display');
    const octDisplay = document.querySelector('.oct-display');
    const expressionDisplay = document.querySelector('.calculator-expression');
    const binaryDisplay = document.querySelector('.binary-representation');
    const numSystemSelect = document.getElementById('num-system');
    const bitWidthSelect = document.getElementById('bit-width');
    const signedRadio = document.getElementById('signed');
    const unsignedRadio = document.getElementById('unsigned');
    const buttons = document.querySelectorAll('.btn');
    const hexKeys = document.querySelectorAll('.hex-key');
    // 获取进制标签元素
    const displayLabels = document.querySelectorAll('.display-label');

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

    // 更新所有显示内容
    function updateDisplay() {
        // 检查每个DOM元素，并用可选链操作符处理
        try {
            // 获取当前值的十进制表示
            const decimalValue = parseInt(state.displayValue, state.numSystem);
            
            if (!isNaN(decimalValue)) {
                // 十进制显示 - 先检查元素是否存在
                if (display) {
                    display.textContent = decimalValue.toString();
                }
                
                // 十六进制显示（大写字母，不带前缀，分组）
                if (hexDisplay) {
                    const hexValue = decimalValue.toString(16).toUpperCase();
                    hexDisplay.innerHTML = formatGroupedHex(hexValue);
                }
                
                // 八进制显示
                if (octDisplay) {
                    octDisplay.textContent = decimalValue.toString(8);
                }
                
                // 只有在二进制显示元素存在时更新二进制表示
                if (binaryDisplay) {
                    updateBinaryRepresentation(decimalValue);
                }
                
                // 更新范围提示
                updateRangeIndicator();
            } else {
                // 错误或无效输入时的显示
                if (display) display.textContent = state.displayValue;
                if (hexDisplay) hexDisplay.textContent = '';
                if (octDisplay) octDisplay.textContent = '';
                if (binaryDisplay) binaryDisplay.textContent = '';
            }
            
            // 更新表达式显示
            if (expressionDisplay) {
                expressionDisplay.textContent = state.expression;
            }
            
            // 更新计算器UI以反映signed/unsigned模式
            if (calculator) {
                calculator.classList.toggle('signed-mode', state.isSigned);
                calculator.classList.toggle('unsigned-mode', !state.isSigned);
            }
        } catch (error) {
            console.error('更新显示时出错:', error);
        }
    }
    
    // 格式化十六进制显示，每4位分组
    function formatGroupedHex(hexValue) {
        let result = '';
        
        // 按4个字符一组进行分组
        for (let i = 0; i < hexValue.length; i++) {
            if (i > 0 && i % 4 === 0) {
                result += '<span class="hex-separator"> </span>';
            }
            result += `<span class="hex-digit">${hexValue[i]}</span>`;
        }
        
        return result;
    }
    
    // 显示当前范围提示
    function updateRangeIndicator() {
        // 检查state变量是否存在
        if (typeof state === 'undefined') {
            return;  // 如果state不存在，不进行任何操作
        }
        
        const bitWidth = state.bitWidth;
        let rangeInfo = '';
        
        if (state.isSigned) {
            const maxValue = (1 << (bitWidth - 1)) - 1;
            const minValue = -(1 << (bitWidth - 1));
            rangeInfo = `${minValue} ~ ${maxValue}`;
        } else {
            const maxValue = (1 << bitWidth) - 1;
            rangeInfo = `0 ~ ${maxValue}`;
        }
        
        // 如果存在范围指示器元素，更新它
        const rangeIndicator = document.querySelector('.range-indicator');
        if (rangeIndicator) {
            rangeIndicator.textContent = `${state.isSigned ? '有符号' : '无符号'} ${bitWidth}位: ${rangeInfo}`;
        }
    }

    // 根据当前数字系统格式化显示值（用于状态表达式）
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
    function updateBinaryRepresentation(decimalValue) {
        // 检查必要的DOM元素是否存在
        if (!binaryDisplay) {
            console.warn('二进制显示元素未找到，无法更新二进制表示');
            return;
        }
        
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
        
        // 使用HTML创建带有高亮的二进制显示
        binaryDisplay.innerHTML = '';
        
        // 分组显示二进制位，每4位一组，并添加特殊样式
        for (let i = 0; i < binaryStr.length; i++) {
            const bit = document.createElement('span');
            bit.textContent = binaryStr[i];
            bit.className = 'binary-bit';
            
            // 添加额外的样式类
            if (i === 0 && state.isSigned) {
                bit.classList.add('sign-bit');
                bit.setAttribute('title', '符号位');
            } else if ((i + 1) % 4 === 0) {
                bit.classList.add('group-end');
            }
            
            // 为1添加高亮
            if (binaryStr[i] === '1') {
                bit.classList.add('bit-one');
            } else {
                bit.classList.add('bit-zero');
            }
            
            binaryDisplay.appendChild(bit);
            
            // 每4位添加一个空格分隔符（除了最后一位）
            if ((i + 1) % 4 === 0 && i < binaryStr.length - 1) {
                const spacer = document.createElement('span');
                spacer.textContent = ' ';
                spacer.className = 'bit-spacer';
                binaryDisplay.appendChild(spacer);
            }
        }
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
        let outOfRange = false;

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
                
                // 标记为超出范围，以便显示警告
                outOfRange = true;
            }
            
            // 检查是否超出范围
            if (decimalValue > maxValue || decimalValue < minValue) {
                outOfRange = true;
            }
            
            result = Math.max(minValue, Math.min(maxValue, decimalValue));
        } else {
            // 无符号数的范围限制
            const maxValue = (1 << bitWidth) - 1;
            
            // 检查是否超出范围
            if (decimalValue < 0 || decimalValue > maxValue) {
                outOfRange = true;
            }
            
            result = decimalValue & maxValue;
        }

        // 如果值超出范围，显示警告
        if (outOfRange) {
            showRangeWarning(result);
        } else {
            clearRangeWarning();
        }

        state.displayValue = result.toString(state.numSystem);
    }
    
    // 显示范围警告
    function showRangeWarning(clampedValue) {
        // 添加视觉警告样式到显示区域
        display.classList.add('range-warning');
        
        // 创建或更新警告提示
        let warning = document.querySelector('.range-warning-message');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'range-warning-message';
            calculator.appendChild(warning);
        }
        
        // 设置警告消息
        const bitWidth = state.bitWidth;
        if (state.isSigned) {
            const maxValue = (1 << (bitWidth - 1)) - 1;
            const minValue = -(1 << (bitWidth - 1));
            warning.textContent = `值已被限制在有符号${bitWidth}位范围内: ${minValue} ~ ${maxValue}`;
        } else {
            const maxValue = (1 << bitWidth) - 1;
            warning.textContent = `值已被限制在无符号${bitWidth}位范围内: 0 ~ ${maxValue}`;
        }
        
        warning.classList.add('visible');
        
        // 两秒后自动消失
        setTimeout(() => {
            clearRangeWarning();
        }, 2000);
    }
    
    // 清除范围警告
    function clearRangeWarning() {
        display.classList.remove('range-warning');
        const warning = document.querySelector('.range-warning-message');
        if (warning) {
            warning.classList.remove('visible');
        }
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
            'open-paren': '(',
            'close-paren': ')',
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
        try {
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
                            
                            // 更新显示值
                            state.displayValue = signedValue.toString(state.numSystem);
                            
                            // 显示一个临时提示，指示值已被转换为有符号表示
                            showModeChangeNotification(`值已转换为有符号表示: ${signedValue}`);
                            
                            // 立即更新显示并退出
                            updateDisplay();
                            return;
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
                        
                        // 更新显示值为补码形式
                        state.displayValue = unsignedValue.toString(state.numSystem);
                        
                        // 显示一个临时提示，指示负值已被转换为无符号表示
                        showModeChangeNotification(`负值已转换为无符号表示: ${unsignedValue}`);
                        
                        // 立即更新显示并退出
                        updateDisplay();
                        return;
                    }
                }
            }
            
            // 更新取负按钮状态
            updateNegButtonState();
            
            // 应用位宽限制并更新显示
            applyBitWidthLimit();
            
            // 如果模式发生变化但没有触发具体转换，显示一般通知
            if (oldSigned !== isSigned) {
                showModeChangeNotification(`已切换到${isSigned ? '有符号' : '无符号'}模式`);
            }
            
            updateDisplay();
        } catch (error) {
            console.error('切换符号模式时出错:', error);
        }
    }
    
    // 更新取负按钮状态
    function updateNegButtonState() {
        try {
            const negButton = document.querySelector('[data-action="neg"]');
            if (negButton) {
                negButton.disabled = !state.isSigned;
                negButton.classList.toggle('disabled', !state.isSigned);
                
                // 如果是无符号模式，添加提示
                if (!state.isSigned) {
                    negButton.setAttribute('title', '在无符号模式下不可用');
                } else {
                    negButton.setAttribute('title', '取负');
                }
            }
        } catch (error) {
            console.error('更新取负按钮状态时出错:', error);
        }
    }

    // 显示临时模式变更通知
    function showModeChangeNotification(message) {
        try {
            // 检查calculator元素是否存在
            if (!calculator) {
                console.warn('计算器元素未找到，无法显示模式变更通知');
                return;
            }
            
            // 检查是否已有通知元素存在
            let notification = document.querySelector('.mode-change-notification');
            
            // 如果不存在则创建
            if (!notification) {
                notification = document.createElement('div');
                notification.className = 'mode-change-notification';
                calculator.appendChild(notification);
            }
            
            // 设置消息并显示
            notification.textContent = message;
            notification.classList.add('visible');
            
            // 淡出效果
            setTimeout(() => {
                notification.classList.remove('visible');
            }, 2000);
        } catch (error) {
            console.error('显示模式变更通知时出错:', error);
        }
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
                case 'and':
                case 'or':
                case 'xor':
                case 'open-paren':
                case 'close-paren':
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
            updateRadioButtonStyling();
        }
    });
    
    unsignedRadio.addEventListener('change', () => {
        if (unsignedRadio.checked) {
            toggleSignMode(false);
            updateRadioButtonStyling();
        }
    });
    
    // 更新单选按钮样式
    function updateRadioButtonStyling() {
        // 获取单选按钮的父容器
        const signedLabel = signedRadio.parentElement;
        const unsignedLabel = unsignedRadio.parentElement;
        
        // 更新标签的活动状态样式
        if (signedRadio.checked) {
            signedLabel.classList.add('active');
            unsignedLabel.classList.remove('active');
        } else {
            signedLabel.classList.remove('active');
            unsignedLabel.classList.add('active');
        }
    }

    // 为进制显示标签添加点击事件
    displayLabels.forEach(label => {
        label.addEventListener('click', () => {
            // 获取标签文本并转换为相应的进制值
            const labelText = label.textContent.trim();
            let numSystem = 10; // 默认十进制
            
            switch (labelText) {
                case 'HEX':
                    numSystem = 16;
                    break;
                case 'DEC':
                    numSystem = 10;
                    break;
                case 'OCT':
                    numSystem = 8;
                    break;
                case 'BIN':
                    numSystem = 2;
                    break;
            }
            
            // 更新选择器的值以匹配点击的标签
            numSystemSelect.value = numSystem;
            
            // 切换到对应的进制
            changeNumberSystem(numSystem);
        });
    });
    
    // 初始化计算器
    updateHexKeysState();
    updateRadioButtonStyling();
    updateNegButtonState();
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
            case '(':
                handleOperator('open-paren');
                updateDisplay();
                event.preventDefault();
                break;
            case ')':
                handleOperator('close-paren');
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

    // 添加动态样式
    addCalculatorStyles();
    
    // 确保所有显示内容初始化完成
    updateDisplay();
});

// 添加计算器需要的动态样式
function addCalculatorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 符号位高亮 */
        .sign-bit {
            color: #ff5252;
            font-weight: bold;
            text-decoration: underline;
        }
        
        /* 二进制表示的样式 */
        .binary-bit {
            font-family: monospace;
            padding: 0 1px;
        }
        
        .bit-spacer {
            margin: 0 2px;
        }
        
        .bit-one {
            color: #4caf50;
            font-weight: bold;
        }
        
        .bit-zero {
            color: #9e9e9e;
        }
        
        /* 十六进制分组样式 */
        .hex-digit {
            font-family: monospace;
            padding: 0 1px;
        }
        
        .hex-separator {
            margin: 0 2px;
            color: #9e9e9e;
        }
        
        /* 已禁用的按钮样式 */
        .btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* 单选按钮标签样式 */
        .radio-label.active {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #1565c0;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* 范围警告样式 */
        .range-warning {
            animation: warning-flash 0.5s alternate 2;
        }
        
        @keyframes warning-flash {
            from { background-color: inherit; }
            to { background-color: rgba(255, 82, 82, 0.3); }
        }
        
        .range-warning-message {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff5252;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 10;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .range-warning-message.visible {
            opacity: 1;
        }
        
        /* 模式切换通知 */
        .mode-change-notification {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2196f3;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 10;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .mode-change-notification.visible {
            opacity: 1;
        }
        
        /* 符号模式样式 */
        .calculator.signed-mode .signed-indicator,
        .calculator.unsigned-mode .unsigned-indicator {
            font-weight: bold;
            text-decoration: underline;
            color: #2196f3;
        }
        
        /* 范围指示器样式 */
        .range-indicator {
            font-size: 12px;
            color: #757575;
            text-align: center;
            margin-top: 5px;
            padding: 4px;
            background-color: #f1f1f1;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
    
    // 创建范围指示器元素
    const rangeIndicator = document.createElement('div');
    rangeIndicator.className = 'range-indicator';
    
    // 检查calculator元素是否存在
    const calculator = document.querySelector('.calculator');
    if (calculator) {
        calculator.appendChild(rangeIndicator);
        // 注意：不在这里调用updateRangeIndicator()
        // 将在DOMContentLoaded中完成初始化后调用
    }
} 