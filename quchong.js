(function() {
    const CONFIG = {
        FILE_EXT_WHITELIST: ['xlsx', 'xls'],
        DEFAULT_END_COLUMN_LIMIT: 20,
        ALERT_DURATION: 1500,
        EXPORT_FILE_PREFIX: 'Excel去重结果_'
    };

    const DOM = {
        uploadPageBtn: () => getElement('uploadPageBtn'),
        resultPageBtn: () => getElement('resultPageBtn'),
        uploadPage: () => getElement('uploadPage'),
        resultPage: () => getElement('resultPage'),
        excelFile: () => getElement('excelFile'),
        startColumn: () => getElement('startColumn'),
        endColumn: () => getElement('endColumn'),
        checkColumn: () => getElement('checkColumn'),
        uploadBtn: () => getElement('uploadBtn'),
        confirmBtn: () => getElement('confirmBtn'),
        alertMessage: () => getElement('alertMessage'),
        resultTable: () => getElement('resultTable'),
        tableHeader: () => getElement('tableHeader'),
        tableBody: () => getElement('tableBody'),
        exportResultBtn: () => getElement('exportResultBtn')
    };

    const state = {
        excelWorkbook: null,
        sheetData: [],
        columnLetters: [],
        maxColumnCount: 0,
        processedResult: [],
        uploadFileName: ''
    };

    // ========== 工具函数 ==========
    /**
     * 获取DOM元素（增强容错）
     * @param {string} id 元素ID
     * @returns {HTMLElement|null}
     */
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) console.warn(`未找到ID为${id}的DOM元素`);
        return element;
    }

    /**
     * 显示提示信息
     * @param {string} text 提示文本
     * @param {string} type 类型（success/error）
     */
    function showAlert(text, type = 'success') {
        const alertEl = DOM.alertMessage();
        if (!alertEl) return;
        
        alertEl.textContent = text;
        alertEl.style.display = 'block';
        alertEl.className = `alert alert-${type}`;
        
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, CONFIG.ALERT_DURATION);
    }

    /**
     * 读取文件为ArrayBuffer
     * @param {File} file 文件对象
     * @returns {Promise<ArrayBuffer>}
     */
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error(`文件读取失败: ${e.message}`));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 生成Excel列字母（A、B、C...AA、AB...）
     * @param {number} count 列数
     * @returns {string[]}
     */
    function generateColumnLetters(count) {
        const letters = [];
        for (let i = 0; i < count; i++) {
            let letter = '';
            let num = i;
            while (num >= 0) {
                const remainder = num % 26;
                letter = String.fromCharCode(65 + remainder) + letter;
                num = Math.floor(num / 26) - 1;
                if (num < 0) break;
            }
            letters.push(letter);
        }
        return letters;
    }

    // ========== 页面控制 ==========
    /**
     * 切换页面
     * @param {string} targetPageId 目标页面ID
     */
    function switchPage(targetPageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        const targetPage = getElement(targetPageId);
        if (targetPage) targetPage.classList.add('active');
        
        if (targetPageId === 'uploadPage') {
            DOM.uploadPageBtn()?.classList.add('active');
        } else if (targetPageId === 'resultPage') {
            DOM.resultPageBtn()?.classList.add('active');
        }
    }

    // ========== Excel处理逻辑 ==========
    /**
     * 填充列选择下拉框
     */
    function fillColumnSelects() {
        const selects = [DOM.startColumn(), DOM.endColumn(), DOM.checkColumn()].filter(Boolean);
        if (selects.length === 0) return;

        selects.forEach(select => {
            select.innerHTML = '';
            select.disabled = false;
        });

        state.columnLetters.forEach((letter, index) => {
            selects.forEach(select => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = letter;
                select.appendChild(option);
            });
        });

        DOM.startColumn().value = 0;
        DOM.endColumn().value = Math.min(CONFIG.DEFAULT_END_COLUMN_LIMIT, state.maxColumnCount - 1);
        DOM.checkColumn().value = 0;
    }

    /**
     * 解析Excel文件
     * @param {File} file Excel文件
     */
    async function parseExcelFile(file) {
        try {
            state.uploadFileName = file.name.replace(/\.(xlsx|xls)$/i, '');

            const fileData = await readFileAsArrayBuffer(file);
            state.excelWorkbook = XLSX.read(fileData, { type: 'array' });

            const firstSheetName = state.excelWorkbook.SheetNames[0];
            const worksheet = state.excelWorkbook.Sheets[firstSheetName];
            state.sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (state.sheetData.length <= 1) {
                throw new Error('Excel工作表中无有效数据，请检查文件！');
            }

            state.maxColumnCount = Math.max(...state.sheetData.map(row => row.length || 0));
            state.columnLetters = generateColumnLetters(state.maxColumnCount);

            fillColumnSelects();
            DOM.confirmBtn().disabled = false;
            const alertMessage = document.getElementById('alertMessage');
            alertMessage.textContent = 'Excel文件解析成功！';
            alertMessage.style.display = 'block';
            setTimeout(() => {
                alertMessage.style.display = 'none';
            }, 1500);

        } catch (error) {
            console.error('Excel解析失败：', error);
            showAlert(error.message || 'Excel文件解析失败，请检查文件完整性或更换文件！', 'error');
            DOM.excelFile().value = '';
            DOM.uploadBtn().disabled = true;
            state.sheetData = [];
            state.maxColumnCount = 0;
        }
    }

    /**
     * 处理Excel去重逻辑
     */
    function processExcelDeduplication() {
        if (state.sheetData.length <= 1 || state.maxColumnCount === 0) return;

        const startColIndex = parseInt(DOM.startColumn().value);
        const endColIndex = parseInt(DOM.endColumn().value);
        const checkColIndex = parseInt(DOM.checkColumn().value);

        if (isNaN(startColIndex) || isNaN(endColIndex) || isNaN(checkColIndex)) {
            showAlert('列选择参数异常，请重新选择！', 'error');
            return;
        }
        if (startColIndex > endColIndex) {
            showAlert('起始列不能大于结束列，请重新选择！', 'error');
            return;
        }
        if (checkColIndex < startColIndex || checkColIndex > endColIndex) {
            showAlert('查重列必须在选择的数据源范围内，请重新选择！', 'error');
            return;
        }

        const headerRow = state.sheetData[0] || [];
        const dataRows = state.sheetData.slice(1);

        const checkValueMap = new Map();
        state.processedResult = [];

        const resultHeader = headerRow.slice(startColIndex, endColIndex + 1).map(item => item || '未知列');
        state.processedResult.push(resultHeader);

        dataRows.forEach(row => {
            const checkValue = row[checkColIndex] === undefined ? '' : String(row[checkColIndex]).trim();
            if (checkValue && !checkValueMap.has(checkValue)) {
                checkValueMap.set(checkValue, true);
                const rowData = [];
                for (let i = startColIndex; i <= endColIndex; i++) {
                    rowData.push(row[i] === undefined ? '' : row[i]);
                }
                state.processedResult.push(rowData);
            }
        });

        renderResultTable();
        switchPage('resultPage');
        DOM.exportResultBtn().disabled = false;
    }

    /**
     * 渲染去重结果表格
     */
    function renderResultTable() {
        const headerEl = DOM.tableHeader();
        const bodyEl = DOM.tableBody();
        if (!headerEl || !bodyEl) return;

        headerEl.innerHTML = '';
        bodyEl.innerHTML = '';

        if (state.processedResult.length <= 1) {
            const emptyTd = document.createElement('td');
            emptyTd.colSpan = state.processedResult[0]?.length || 1;
            emptyTd.className = 'empty-tip';
            emptyTd.textContent = '无有效去重结果，请检查原始数据！';
            const emptyTr = document.createElement('tr');
            emptyTr.appendChild(emptyTd);
            bodyEl.appendChild(emptyTr);
            return;
        }

        const theadTr = document.createElement('tr');
        state.processedResult[0].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            theadTr.appendChild(th);
        });
        headerEl.appendChild(theadTr);

        state.processedResult.slice(1).forEach(rowData => {
            const tbodyTr = document.createElement('tr');
            rowData.forEach(cellData => {
                const td = document.createElement('td');
                td.textContent = cellData;
                tbodyTr.appendChild(td);
            });
            bodyEl.appendChild(tbodyTr);
        });
    }

    /**
     * 导出去重结果为Excel
     */
    function exportDeduplicationResult() {
        if (state.processedResult.length <= 1) {
            showAlert('无有效数据可导出！', 'error');
            return;
        }

        const worksheet = XLSX.utils.aoa_to_sheet(state.processedResult);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, '去重结果');

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}${today.getSeconds().toString().padStart(2, '0')}`;
        const fileNamePrefix = state.uploadFileName || '未命名文件';
        const fileName = `${dateStr} ${timeStr}_${state.uploadFileName}_去重.xlsx`;

        XLSX.writeFile(newWorkbook, fileName);
    }

    // ========== 事件绑定 ==========
    function bindEvents() {
        DOM.uploadPageBtn()?.addEventListener('click', () => switchPage('uploadPage'));
        DOM.resultPageBtn()?.addEventListener('click', () => switchPage('resultPage'));

        DOM.excelFile()?.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) {
                DOM.uploadBtn().disabled = true;
                return;
            }

            const fileExt = file.name.split('.').pop().toLowerCase();
            if (CONFIG.FILE_EXT_WHITELIST.includes(fileExt)) {
                DOM.uploadBtn().disabled = false;
            } else {
                showAlert(`请上传正确的Excel文件，仅支持${CONFIG.FILE_EXT_WHITELIST.join('、')}格式！`, 'error');
                this.value = '';
                DOM.uploadBtn().disabled = true;
            }
        });

        DOM.uploadBtn()?.addEventListener('click', async function() {
            const file = DOM.excelFile().files[0];
            if (!file) return;
            await parseExcelFile(file);
        });

        DOM.confirmBtn()?.addEventListener('click', processExcelDeduplication);

        DOM.exportResultBtn()?.addEventListener('click', exportDeduplicationResult);
    }

    // ========== 初始化 ==========
    function init() {
        DOM.uploadBtn().disabled = true;
        DOM.confirmBtn().disabled = true;
        DOM.exportResultBtn().disabled = true;
        bindEvents();
        switchPage('uploadPage');
    }

    document.addEventListener('DOMContentLoaded', init);
})();