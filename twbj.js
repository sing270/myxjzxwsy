const AppState = {
    editor: null,
    firstimgContainer: null,
    blueContainer: null,
    textModal: null,
    imageLayout: 'single',
    pendingImage: null,
    copiedStyles: null,
    isContinuousMode: false,
    selectedImage: null,
    imageAspectRatio: 1,
    currentTask: null
};

function initElements() {
    AppState.editor = document.querySelector('.editor');
    AppState.firstimgContainer = document.querySelector('.firstimg');
    AppState.blueContainer = document.querySelector('.blue');
    AppState.textModal = document.getElementById('textModal');

    return {
        addTextBtn: document.getElementById('addTextBtn'),
        addImageBtn: document.getElementById('addImageBtn'),
        addFirstimgBtn: document.getElementById('addFirstimgBtn'),
        savefileBtn: document.getElementById('savefile'),
        clearfileBtn: document.getElementById('clearfile'),
        taskList: document.getElementById('taskList'),
        textInput: document.getElementById('textInput'),
        confirmTextBtn: document.getElementById('confirmTextBtn'),
        cancelTextBtn: document.getElementById('cancelTextBtn'),
        zihaoSelect: document.getElementById('zihao'),
        bgColorPicker: document.getElementById('bgColorPicker'),
        textColorPicker: document.getElementById('textColorPicker'),
        textpic: document.querySelector('.textpic'),
        editorContainer: document.querySelector('.editor-container'),
        fontFamilySelect: document.getElementById('fontFamily'),
        boldBtn: document.getElementById('boldBtn'),
        italicBtn: document.getElementById('italicBtn'),
        underlineBtn: document.getElementById('underlineBtn'),
        strikeBtn: document.getElementById('strikeBtn'),
        leftAlignBtn: document.getElementById('leftAlignBtn'),
        centerAlignBtn: document.getElementById('centerAlignBtn'),
        rightAlignBtn: document.getElementById('rightAlignBtn'),
        justifyAlignBtn: document.getElementById('justifyAlignBtn'),
        imageSizeControls: document.getElementById('imageSizeControls'),
        imgWidth: document.getElementById('imgWidth'),
        imgHeight: document.getElementById('imgHeight'),
        lockAspectRatio: document.getElementById('lockAspectRatio'),
        singleImageBtn: document.getElementById('singleImageBtn'),
        sideBySideBtn: document.getElementById('sideBySideBtn'),
        formatPainter: document.getElementById('formatPainter'),
        outputfileBtn: document.getElementById('outputfile'),
        newTaskBtn: document.getElementById('newtask'),
        cleartaskBtn: document.getElementById('cleartask'),
        borColorPicker: document.getElementById('borColorPicker'),
        bor1Container: document.querySelector('.bor1')
    };
}

const FormatPainter = {
    elements: null,
    clickCount: 0,
    clickTimer: null,

    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.elements.formatPainter.addEventListener('click', (e) => {
            e.preventDefault();
            this.clickCount++;

            if (this.clickCount === 1) {
                this.clickTimer = setTimeout(() => {
                    this.handleSingleClick();
                    this.clickCount = 0;
                }, 300);
            } else if (this.clickCount === 2) {
                clearTimeout(this.clickTimer);
                this.handleDoubleClick();
                this.clickCount = 0;
            }
        });
    },

    handleSingleClick() {
        if (AppState.copiedStyles && !AppState.isContinuousMode) {
            this.reset();
        } else {
            AppState.copiedStyles = this.copySelectedStyles();
            if (AppState.copiedStyles) {
                this.elements.formatPainter.classList.add('active');
                document.addEventListener('mouseup', this.applyOnceHandler.bind(this));
            }
        }
    },

    handleDoubleClick() {
        AppState.copiedStyles = this.copySelectedStyles();
        if (AppState.copiedStyles) {
            AppState.isContinuousMode = true;
            this.elements.formatPainter.classList.add('active');
            document.addEventListener('mouseup', this.applyCopiedStyles.bind(this));
        }
    },

    applyOnceHandler(e) {
        if (e.target.closest('[contenteditable="true"]')) {
            this.applyCopiedStyles(e);
            this.reset();
            document.removeEventListener('mouseup', this.applyOnceHandler.bind(this));
        }
    },

    copySelectedStyles() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            alert('请先选中要复制格式的内容');
            return null;
        }

        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }

        const computed = window.getComputedStyle(element);
        const textDecoration = computed.textDecoration;

        return {
            fontSize: computed.fontSize,
            fontFamily: computed.fontFamily,
            color: computed.color,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            textAlign: computed.textAlign,
            hasUnderline: textDecoration.includes('underline'),
            hasStrike: textDecoration.includes('line-through')
        };
    },

    applyCopiedStyles(e) {
        if (!AppState.copiedStyles) return;
        if (!e.target.closest('[contenteditable="true"]')) return;

        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) return;

        document.execCommand('styleWithCSS', false, true);

        if (AppState.copiedStyles.fontSize) {
            document.execCommand('fontSize', false, '');
            const span = document.createElement('span');
            span.style.fontSize = AppState.copiedStyles.fontSize;
            span.appendChild(selection.getRangeAt(0).extractContents());
            selection.getRangeAt(0).insertNode(span);
        }
        
        if (AppState.copiedStyles.fontFamily) {
            document.execCommand('fontName', false, AppState.copiedStyles.fontFamily);
        }
        
        if (AppState.copiedStyles.color) {
            document.execCommand('foreColor', false, AppState.copiedStyles.color);
        }
        
        if (['bold', '700'].includes(AppState.copiedStyles.fontWeight)) {
            document.execCommand('bold', false, null);
        }
        
        if (AppState.copiedStyles.fontStyle === 'italic') {
            document.execCommand('italic', false, null);
        }
        
        if (AppState.copiedStyles.hasUnderline) {
            document.execCommand('underline', false, null);
        }

        if (AppState.copiedStyles.hasStrike) {
            document.execCommand('strikeThrough', false, null);
        }

        const alignCommands = {
            'left': 'justifyLeft',
            'center': 'justifyCenter',
            'right': 'justifyRight',
            'justify': 'justifyFull'
        };
        if (alignCommands[AppState.copiedStyles.textAlign]) {
            document.execCommand(alignCommands[AppState.copiedStyles.textAlign], false, null);
        }
        
        document.execCommand('styleWithCSS', false, false);
        
        if (!AppState.isContinuousMode) {
            this.reset();
        }
    },

    reset() {
        AppState.copiedStyles = null;
        AppState.isContinuousMode = false;
        this.elements.formatPainter.classList.remove('active');
        document.removeEventListener('mouseup', this.applyCopiedStyles.bind(this));
    }
};

const TextEditor = {
    elements: null,

    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        this.setDefaultStyles();
    },

    setupEventListeners() {
        this.elements.zihaoSelect.addEventListener('change', this.applyFontSize.bind(this));
        document.addEventListener('selectionchange', this.updateFontSizeSelection.bind(this));

        this.elements.fontFamilySelect.addEventListener('change', this.applyFontFamily.bind(this));
        document.addEventListener('selectionchange', this.updateFontFamilySelection.bind(this));

        this.elements.textColorPicker.addEventListener('input', this.applyTextColor.bind(this));

        this.elements.leftAlignBtn.addEventListener('click', () => this.applyAlign('justifyLeft'));
        this.elements.centerAlignBtn.addEventListener('click', () => this.applyAlign('justifyCenter'));
        this.elements.rightAlignBtn.addEventListener('click', () => this.applyAlign('justifyRight'));
        this.elements.justifyAlignBtn.addEventListener('click', () => this.applyAlign('justifyFull'));

        this.elements.boldBtn.addEventListener('click', () => this.toggleStyle('bold'));
        this.elements.italicBtn.addEventListener('click', () => this.toggleStyle('italic'));
        this.elements.underlineBtn.addEventListener('click', () => this.toggleStyle('underline'));
        this.elements.strikeBtn.addEventListener('click', () => this.toggleStyle('strikeThrough'));

        document.addEventListener('selectionchange', this.updateStyleButtonsState.bind(this));
        
        AppState.editor.addEventListener('input', this.handleEditorInput.bind(this));
    },

    setDefaultStyles() {
        AppState.editor.style.textAlign = 'justify';
        this.elements.justifyAlignBtn.classList.add('active');
    },

    applyFontSize() {
        const fontSize = this.elements.zihaoSelect.value;
        if (!fontSize) return;

        const sizeToApply = `${fontSize}px`;
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            if (!selection.isCollapsed) {
                document.execCommand('fontSize', false, '');
                const span = document.createElement('span');
                span.style.fontSize = sizeToApply;
                span.appendChild(selection.getRangeAt(0).extractContents());
                selection.getRangeAt(0).insertNode(span);
            } else {
                const style = document.createElement('style');
                style.type = 'text/css';
                style.textContent = `[contenteditable=true]:empty:before { font-size: ${sizeToApply}; }`;
                document.head.appendChild(style);
                setTimeout(() => document.head.removeChild(style), 0);
                
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('fontSize', false, '');
                document.execCommand('foreColor', false, this.elements.textColorPicker.value);
            }
        }
    },

    updateFontSizeSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }

        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseInt(computedStyle.fontSize, 10);
        this.elements.zihaoSelect.value = isNaN(fontSize) ? '' : fontSize;
    },

    applyFontFamily() {
        const fontFamily = this.elements.fontFamilySelect.value;
        if (fontFamily) {
            document.execCommand('fontName', false, fontFamily);
        }
    },

    updateFontFamilySelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }

        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        this.elements.fontFamilySelect.value = fontFamily || '';
    },

    applyTextColor() {
        document.execCommand('foreColor', false, this.elements.textColorPicker.value);
    },

    applyAlign(command) {
        document.execCommand(command, false, null);
        document.dispatchEvent(new Event('selectionchange'));
    },

    toggleStyle(command) {
        document.execCommand(command, false, null);
        document.dispatchEvent(new Event('selectionchange'));
    },

    updateStyleButtonsState() {
        this.updateBoldButtonState();
        this.updateItalicButtonState();
        this.updateUnderlineButtonState();
        this.updateStrikeButtonState();
        this.updateAlignButtonsState();
    },

    updateBoldButtonState() {
        const isBold = this.checkStyleState('fontWeight', ['bold', '700']);
        this.elements.boldBtn.classList.toggle('active', isBold);
    },

    updateItalicButtonState() {
        const isItalic = this.checkStyleState('fontStyle', ['italic']);
        this.elements.italicBtn.classList.toggle('active', isItalic);
    },

    updateUnderlineButtonState() {
        const isUnderline = this.checkStyleState('textDecoration', (val) => val.includes('underline'));
        this.elements.underlineBtn.classList.toggle('active', isUnderline);
    },

    updateStrikeButtonState() {
        const isStrike = this.checkStyleState('textDecoration', (val) => val.includes('line-through'));
        this.elements.strikeBtn.classList.toggle('active', isStrike);
    },

    updateAlignButtonsState() {
        const textAlign = this.getBlockElementStyle('textAlign');
        
        this.elements.leftAlignBtn.classList.toggle('active', ['left', 'start'].includes(textAlign));
        this.elements.centerAlignBtn.classList.toggle('active', textAlign === 'center');
        this.elements.rightAlignBtn.classList.toggle('active', ['right', 'end'].includes(textAlign));
        this.elements.justifyAlignBtn.classList.toggle('active', textAlign === 'justify');
    },

    checkStyleState(styleName, checkValue) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return false;

        let element = selection.getRangeAt(0).commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }

        const styleValue = window.getComputedStyle(element)[styleName];
        
        if (typeof checkValue === 'function') {
            return checkValue(styleValue);
        }
        return Array.isArray(checkValue) ? checkValue.includes(styleValue) : styleValue === checkValue;
    },

    getBlockElementStyle(styleName) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return '';

        let element = selection.getRangeAt(0).commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }

        let targetElement = element;
        while (targetElement && targetElement !== document.body) {
            const display = window.getComputedStyle(targetElement).display;
            if (display.includes('block') || display.includes('flex') || display.includes('grid')) {
                break;
            }
            targetElement = targetElement.parentElement;
        }

        return window.getComputedStyle(targetElement)[styleName];
    },

    handleEditorInput() {
    }
};

const ImageHandler = {
    elements: null,

    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.elements.singleImageBtn.addEventListener('click', () => this.setImageView('single'));
        this.elements.sideBySideBtn.addEventListener('click', () => this.setImageView('sideBySide'));

        AppState.editor.addEventListener('click', this.handleImageSelection.bind(this));
        AppState.firstimgContainer.addEventListener('click', this.handleImageSelection.bind(this));

        this.elements.imgWidth.addEventListener('input', this.handleImageDimensionChange.bind(this));
        this.elements.imgHeight.addEventListener('input', this.handleImageDimensionChange.bind(this));

        this.elements.addImageBtn.addEventListener('click', this.addImage.bind(this));
        this.elements.addFirstimgBtn.addEventListener('click', this.addFirstImage.bind(this));
    },

    setImageView(layout) {
        AppState.imageLayout = layout;
        this.elements.singleImageBtn.classList.toggle('active', layout === 'single');
        this.elements.sideBySideBtn.classList.toggle('active', layout === 'sideBySide');
        AppState.pendingImage = null;
    },

    addImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readAndProcessImage(file, (img) => {
                    if (AppState.imageLayout === 'sideBySide') {
                        this.handleSideBySideImage(img);
                    } else {
                        this.addSingleImage(img, AppState.editor);
                    }
                });
            }
        });

        input.click();
    },

    addFirstImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readAndProcessImage(file, (img) => {
                    AppState.firstimgContainer.innerHTML = '';
                    this.addSingleImage(img, AppState.firstimgContainer);
                });
            }
        });

        input.click();
    },

    readAndProcessImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.crossOrigin = 'anonymous';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            callback(img);
        };
        reader.readAsDataURL(file);
    },

    handleSideBySideImage(img) {
        if (AppState.pendingImage) {
            const container = document.createElement('div');
            container.className = 'image-container';
            container.appendChild(AppState.pendingImage);
            container.appendChild(img);
            
            AppState.editor.appendChild(container);
            this.addEmptyParagraph();
            AppState.pendingImage = null;
        } else {
            AppState.pendingImage = img;
            alert('请再选择一张图片以并排显示');
        }
    },

    addSingleImage(img, container) {
        container.appendChild(img);
        this.addEmptyParagraph();
    },

    addEmptyParagraph() {
        const p = document.createElement('p');
        p.innerHTML = '&nbsp;';
        const fontSize = this.elements.zihaoSelect.value;
        if (fontSize) {
            p.style.fontSize = `${fontSize}px`;
        }
        AppState.editor.appendChild(p);
    },

    handleImageSelection(e) {
        if (e.target.tagName === 'IMG') {
            AppState.selectedImage = e.target;
            this.elements.imageSizeControls.style.display = 'flex';
            this.elements.imgWidth.value = Math.round(e.target.offsetWidth);
            this.elements.imgHeight.value = Math.round(e.target.offsetHeight);
            AppState.imageAspectRatio = e.target.offsetWidth / e.target.offsetHeight;
        } else {
            AppState.selectedImage = null;
            this.elements.imageSizeControls.style.display = 'none';
        }
    },

    handleImageDimensionChange(e) {
        if (!AppState.selectedImage) return;
        e.stopPropagation();
        
        const width = parseInt(this.elements.imgWidth.value, 10);
        const height = parseInt(this.elements.imgHeight.value, 10);
        
        if (isNaN(width) || isNaN(height)) return;

        if (this.elements.lockAspectRatio.checked) {
            if (e.target === this.elements.imgWidth) {
                this.elements.imgHeight.value = Math.round(width / AppState.imageAspectRatio);
            } else {
                this.elements.imgWidth.value = Math.round(height * AppState.imageAspectRatio);
            }
        }

        AppState.selectedImage.style.width = `${width}px`;
        AppState.selectedImage.style.height = `${height}px`;
    }
};

const TaskManager = {
    elements: null,

    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        this.loadTaskList();
        this.initBorderSettings();
    },

    setupEventListeners() {
        this.elements.savefileBtn.addEventListener('click', this.handleSaveTask.bind(this));
        this.elements.clearfileBtn.addEventListener('click', this.clearContent.bind(this));
        this.elements.newTaskBtn.addEventListener('click', this.createNewTask.bind(this));
        this.elements.cleartaskBtn.addEventListener('click', this.deleteCurrentTask.bind(this));
        this.elements.outputfileBtn.addEventListener('click', this.exportAsImage.bind(this));
        
        this.elements.bgColorPicker.addEventListener('input', (e) => {
            this.elements.editorContainer.style.backgroundColor = e.target.value;
            AppState.blueContainer.style.backgroundColor = e.target.value;
        });
        
        document.querySelectorAll('.preset-color[data-color]').forEach(item => {
            item.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.elements.bgColorPicker.value = color;
                this.elements.editorContainer.style.backgroundColor = color;
                AppState.blueContainer.style.backgroundColor = color;
            });
        });
        
        this.elements.addTextBtn.addEventListener('click', () => this.showTextModal());
        this.elements.cancelTextBtn.addEventListener('click', () => this.hideTextModal());
        this.elements.confirmTextBtn.addEventListener('click', () => this.addTextFromModal());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && AppState.textModal.style.display === 'flex') {
                this.hideTextModal();
            }
        });
        
        AppState.textModal.addEventListener('click', (e) => {
            if (e.target === AppState.textModal) {
                this.hideTextModal();
            }
        });

        this.elements.borColorPicker.addEventListener('input', () => {
            this.updateBorderColor();
        });
    },

    initBorderSettings() {
        if (this.elements.bor1Container) {
            this.elements.bor1Container.style.border = `2px solid #168ef0`;
        }
    },

    updateBorderColor() {
        if (this.elements.bor1Container) {
            this.elements.bor1Container.style.borderColor = this.elements.borColorPicker.value;
        }
    },

    getTasks() {
        const tasks = localStorage.getItem('editorTasks');
        return tasks ? JSON.parse(tasks) : [];
    },

    saveTasks(tasks) {
        localStorage.setItem('editorTasks', JSON.stringify(tasks));
    },

    loadTaskList() {
        const tasks = this.getTasks();
        this.elements.taskList.innerHTML = '';
        
        tasks.forEach(taskName => {
            const btn = document.createElement('button');
            btn.className = `task-btn ${AppState.currentTask === taskName ? 'active' : ''}`;
            btn.textContent = taskName;
            btn.addEventListener('click', () => this.loadTaskContent(taskName));
            this.elements.taskList.appendChild(btn);
        });
    },

    loadTaskContent(taskName) {
        const taskData = localStorage.getItem(`task_${taskName}`);
        if (taskData) {
            const { firstImg, content, blue, bgColor, textColor, fontSize } = JSON.parse(taskData);
            
            AppState.firstimgContainer.innerHTML = firstImg;
            AppState.editor.innerHTML = content;
            AppState.blueContainer.innerHTML = blue;
            
            this.elements.textpic.style.backgroundColor = bgColor || '#ffffff';
            this.elements.bgColorPicker.value = bgColor || '#ffffff';
            this.elements.textColorPicker.value = textColor || '#000000';
            this.elements.zihaoSelect.value = fontSize || '';
            
            AppState.currentTask = taskName;
            document.querySelectorAll('.task-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent === taskName);
            });
        }
    },

    saveTaskContent(taskName, isNew = false) {
        const taskData = {
            firstImg: AppState.firstimgContainer.innerHTML,
            content: AppState.editor.innerHTML,
            blue: AppState.blueContainer.innerHTML,
            timestamp: new Date().getTime(),
            bgColor: this.elements.textpic.style.backgroundColor,
            textColor: this.elements.textColorPicker.value,
            fontSize: this.elements.zihaoSelect.value
        };

        localStorage.setItem(`task_${taskName}`, JSON.stringify(taskData));
        
        if (isNew) {
            const tasks = this.getTasks();
            if (!tasks.includes(taskName)) {
                tasks.unshift(taskName);
                this.saveTasks(tasks);
            }
        }
        
        AppState.currentTask = taskName;
        this.loadTaskList();
        alert(`任务 "${taskName}" 已保存！`);
    },

    handleSaveTask() {
        if (AppState.currentTask) {
            if (confirm(`是否覆盖当前任务 "${AppState.currentTask}"？`)) {
                this.saveTaskContent(AppState.currentTask, false);
            } else {
                const newTaskName = prompt('请输入新任务名称：');
                if (newTaskName && newTaskName.trim() !== '') {
                    this.saveTaskContent(newTaskName.trim(), true);
                }
            }
        } else {
            const taskName = prompt('请输入任务名称：');
            if (taskName && taskName.trim() !== '') {
                this.saveTaskContent(taskName.trim(), true);
            }
        }
    },

    createNewTask() {
        const taskName = prompt('请输入新任务名称：');
        if (!taskName) return;

        const trimmedName = taskName.trim();
        if (!trimmedName) {
            alert('任务名称不能为空！');
            return;
        }

        const tasks = this.getTasks();
        if (tasks.includes(trimmedName)) {
            alert(`任务 "${trimmedName}" 已存在，请使用其他名称！`);
            return;
        }

        this.clearContent(false);
        this.saveTaskContent(trimmedName, true);
        this.loadTaskContent(trimmedName);
    },

    deleteCurrentTask() {
        if (!AppState.currentTask) {
            alert('没有选中的任务可删除！');
            return;
        }

        if (confirm(`确定要删除当前任务 "${AppState.currentTask}" 吗？此操作不可恢复！`)) {
            localStorage.removeItem(`task_${AppState.currentTask}`);
            
            const tasks = this.getTasks();
            const updatedTasks = tasks.filter(task => task !== AppState.currentTask);
            this.saveTasks(updatedTasks);
            
            this.clearContent(false);
            AppState.currentTask = null;
            this.loadTaskList();
            alert('任务已成功删除！');
        }
    },

    clearContent(showConfirm = true) {
        if (showConfirm && !confirm('确定要清除所有内容吗？')) {
            return;
        }

        AppState.editor.innerHTML = '';
        AppState.firstimgContainer.innerHTML = '';
        AppState.blueContainer.innerHTML = '';
        this.elements.textpic.style.backgroundColor = '#ffffff';
        this.elements.bgColorPicker.value = '#ffffff';
        this.elements.textColorPicker.value = '#000000';
        this.elements.zihaoSelect.value = '';
        AppState.pendingImage = null;
        
        if (showConfirm) {
            AppState.currentTask = null;
            document.querySelectorAll('.task-btn').forEach(btn => btn.classList.remove('active'));
        }
    },

    exportAsImage() {
        const container = this.elements.editorContainer;
        
        html2canvas(container, {
            useCORS: true,
            logging: true,
            scale: 2,
            allowTaint: false,
            backgroundColor: null,
            windowWidth: container.scrollWidth,
            windowHeight: container.scrollHeight
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = AppState.currentTask ? `${AppState.currentTask}.png` : '导出公众号图片.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(error => {
            console.error('导出失败:', error);
            alert('导出图片失败，请重试！错误信息：' + error.message);
        });
    },

    showTextModal() {
        this.elements.textInput.value = '';
        AppState.textModal.style.display = 'flex';
        this.elements.textInput.focus();
    },

    hideTextModal() {
        AppState.textModal.style.display = 'none';
    },

    addTextFromModal() {
        const text = this.elements.textInput.value.trim();
        if (text) {
            const p = document.createElement('p');
            p.textContent = text;
            const fontSize = this.elements.zihaoSelect.value;
            if (fontSize) {
                p.style.fontSize = `${fontSize}px`;
            }
            p.style.color = this.elements.textColorPicker.value;
            AppState.editor.appendChild(p);
            
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStartAfter(p);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        this.hideTextModal();
    }
};

function initApp() {
    const elements = initElements();
    
    TextEditor.init(elements);
    ImageHandler.init(elements);
    FormatPainter.init(elements);
    TaskManager.init(elements);
}

window.addEventListener('load', initApp);