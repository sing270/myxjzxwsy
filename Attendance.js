const DataStore = {
    getStaffData() {
        const data = localStorage.getItem('staffData');
        return data ? JSON.parse(data) : [];
    },
    
    saveStaffData(data) {
        localStorage.setItem('staffData', JSON.stringify(data));
    },
    
    getAttendanceData() {
        const data = localStorage.getItem('attendanceData');
        return data ? JSON.parse(data) : [];
    },
    
    saveAttendanceData(data) {
        localStorage.setItem('attendanceData', JSON.stringify(data));
    },
    
    getArrangedData() {
        const data = localStorage.getItem('arrangedData');
        return data ? JSON.parse(data) : [];
    },
    
    saveArrangedData(data) {
        localStorage.setItem('arrangedData', JSON.stringify(data));
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};

const Notification = {
    show(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');

        Object.assign(notification.style, {
            position: 'fixed',
            top: '6rem',
            right: '1.5rem',
            maxWidth: '28rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            zIndex: '50',
        });                
        
        notification.style.transform = 'translateX(0)';

        messageEl.textContent = message;

        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#0f9716';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#a31e0d';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#e66a17';
                notification.style.color = 'white';
                break;
            case 'info':
                notification.style.backgroundColor = '#1b70d1';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#1b70d1';
                notification.style.color = 'white';
        }

        setTimeout(() => {
            notification.style.transform = 'translateX(calc(100% + 1.5rem))'; 
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 1500);
    },
};

const PageSwitcher = {
    init() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.showPage(targetId);
                
                document.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
        
        document.querySelectorAll('.dean-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.showPage(targetId);
            
                document.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                });

                document.querySelectorAll('.dean-link').forEach(item => {
                    item.classList.remove('active');
                });

                document.getElementsByClassName('nav-link')[4].classList.add('active');
                link.classList.add('active');
            });
        });
        
        this.showPage('#file-upload');
        document.getElementsByClassName('nav-link')[0].classList.add('active');
    },
    
    showPage(pageId) {
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        const targetPage = document.querySelector(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');

            if (pageId.startsWith('#dean-')) {
                const deanName = pageId.replace('#dean-', '');                
                if (typeof DeanPage !== 'undefined' && DeanPage.renderDeanData) {
                    DeanPage.renderDeanData(deanName);
                    
                }
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PageSwitcher.init();
});

const FileHandler = {
    parseTxtFile(content) {
        try {
            content = content.trim()
                .replace(/^\s*Return\s*/, '')
                .replace(/\r\n|\r|\n/g, ' ');
            
            const timeRegex = /time="([^"]+)"\s+id="([^"]+)"\s+name="([^"]+)"/g;
            const results = [];
            let match;
            
            while ((match = timeRegex.exec(content)) !== null) {
                const [, datetime, id, name] = match;
                const [date, time] = datetime.includes(' ') 
                    ? datetime.split(' ') 
                    : [datetime.slice(0, 10), datetime.slice(10)]; 
                
                results.push({ date, time, id, name });
            }

            if (results.length === 0) {
                Notification.show('未解析到任何考勤记录，请检查文件格式', 'warning');
            }
            
            return results;
        } catch (error) {
            console.error('解析 TXT 文件失败:', error);
            Notification.show('解析 TXT 文件失败，请检查文件格式', 'error');
            return [];
        }
    },
    
    parseExcelFile(workbook) {
        try {
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const results = jsonData.map(item => {
                const date = item['日期'] || item['date'] || '';
                const time = item['时间'] || item['time'] || '';
                const id = item['工号'] || item['id'] || item['ID'] || item['设备工号'] || '';
                const name = item['姓名'] || item['name'] || '';
                return { date, time, id: id.toString(), name };
            }).filter(item => item.date && item.time && item.id && item.name);
            
            return results;
        } catch (error) {
            console.error('解析 Excel 文件失败:', error);
            Notification.show('解析 Excel 文件失败，请检查文件格式', 'error');
            return [];
        }
    },
    
    parseStaffFile(workbook) {
        try {
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const results = jsonData.map(item => {
                return {
                    id: (item['工号'] || item['id'] || item['设备工号'] || '').toString().trim(),
                    name: (item['姓名'] || item['name'] || '').trim(),
                    department: (item['科室'] || item['department'] || item['所属科室'] || '').trim(),
                    status: (item['状态'] || item['status'] || '').trim(),
                    dean: (item['分管'] || item['dean'] || item['分管院长'] || item['分管领导'] || '').trim()
                };
            }).filter(item => item.id && item.name && item.department && item.status && item.dean);
            
            return results;
        } catch (error) {
            console.error('解析职工文件失败:', error);
            Notification.show('解析职工文件失败，请检查文件格式', 'error');
            return [];
        }
    }
};

const StaffManager = {
    init() {
        this.renderStaffList();
        
        document.getElementById('staff-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStaff();
        });

        document.getElementById('staff-search').addEventListener('input', () => {
            this.renderStaffList();
        });
        
        document.getElementById('staff-batch-upload').addEventListener('change', (e) => {
            this.batchUploadStaff(e.target.files[0]);
        });
        
        document.getElementById('staff-clear-all').addEventListener('click', () => {
            if (confirm('确定要清空所有职工信息吗？此操作不可恢复！')) {
                DataStore.saveStaffData([]);
                this.renderStaffList();
                Notification.show('所有职工信息已清空', 'warning');
            }
        });
        
        document.getElementById('staff-export').addEventListener('click', () => {
            this.exportStaffExcel();
        });
        
        document.getElementById('close-edit-modal').addEventListener('click', () => {
            document.getElementById('edit-staff-modal').classList.remove('show');
        });
        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.getElementById('edit-staff-modal').classList.remove('show');
        });
        
        document.getElementById('edit-staff-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStaff();
            document.getElementById('edit-staff-modal').classList.remove('show');
        });
    },
    
    addStaff() {
        const id = document.getElementById('staff-id').value.trim();
        const name = document.getElementById('staff-name').value.trim();
        const department = document.getElementById('staff-department').value;
        const status = document.getElementById('staff-status').value;
        const dean = document.getElementById('staff-dean').value;
        
        if (!id || !name || !department || !status || !dean) {
            Notification.show('请填写完整的职工信息', 'error');
            return;
        }
        
        const staffData = DataStore.getStaffData();
        
        const exists = staffData.some(staff => staff.id === id);
        if (exists) {
            Notification.show(`工号${id}已存在，请检查输入信息`, 'error');
            return;
        }
        
        const newStaff = {
            id,
            name,
            department,
            status,
            dean,
            createTime: new Date().toISOString()
        };
        
        staffData.push(newStaff);
        DataStore.saveStaffData(staffData);
        
        document.getElementById('staff-form').reset();
        
        this.renderStaffList();
        Notification.show(`保存成功1条职工信息`, 'success');
    },
    
    batchUploadStaff(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const staffList = FileHandler.parseStaffFile(workbook);
                
                if (staffList.length === 0) {
                    Notification.show('未解析到有效职工数据', 'warning');
                    return;
                }
                
                const existingStaff = DataStore.getStaffData();
                const newStaffList = [...existingStaff];
                let successCount = 0;
                let duplicateCount = 0;
                
                staffList.forEach(staff => {
                    const exists = newStaffList.some(s => s.id === staff.id);
                    if (!exists) {
                        newStaffList.push({
                            ...staff,
                            createTime: new Date().toISOString()
                        });
                        successCount++;
                    } else {
                        duplicateCount++;
                    }
                });
                
                DataStore.saveStaffData(newStaffList);
                StaffManager.renderStaffList();
                
                let message = `批量上传成功！新增${successCount}条职工信息`;
                if (duplicateCount > 0) {
                    message += `，跳过${duplicateCount}条重复工号数据`;
                }
                Notification.show(message, 'success');
            } catch (error) {
                console.error('批量上传职工失败:', error);
                Notification.show('批量上传职工失败，请检查文件格式', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    },
    
    updateStaff() {
        const id = document.getElementById('edit-staff-id').value;
        const name = document.getElementById('edit-staff-name').value.trim();
        const department = document.getElementById('edit-staff-department').value;
        const status = document.getElementById('edit-staff-status').value;
        const dean = document.getElementById('edit-staff-dean').value;
        
        if (!name || !department || !status || !dean) {
            Notification.show('请填写完整的职工信息', 'error');
            return;
        }
        
        const staffData = DataStore.getStaffData();
        const index = staffData.findIndex(staff => staff.id === id);
        
        if (index !== -1) {
            staffData[index] = {
                ...staffData[index],
                name,
                department,
                status,
                dean,
                updateTime: new Date().toISOString()
            };
            
            DataStore.saveStaffData(staffData);
            this.renderStaffList();
            
            AttendanceManager.updateStaffInfoInAttendance(id, name, department, status, dean);
            Notification.show('职工信息更新成功', 'success');
        }
    },
    
    deleteStaff(id) {
        if (confirm('确定要删除该职工信息吗？相关考勤数据也会被删除！')) {
            let staffData = DataStore.getStaffData();
            staffData = staffData.filter(staff => staff.id !== id);
            DataStore.saveStaffData(staffData);
            
            AttendanceManager.deleteAttendanceByStaffId(id);
            this.renderStaffList();
            Notification.show('职工信息已删除', 'success');
        }
    },
    
    editStaff(id) {
        const staffData = DataStore.getStaffData();
        const staff = staffData.find(s => s.id === id);
        
        if (staff) {
            document.getElementById('edit-staff-id').value = staff.id;
            document.getElementById('edit-staff-name').value = staff.name;
            document.getElementById('edit-staff-department').value = staff.department;
            document.getElementById('edit-staff-status').value = staff.status;
            document.getElementById('edit-staff-dean').value = staff.dean;
            document.getElementById('edit-staff-modal').classList.add('show');
        }
    },

    renderStaffList() {
        const staffData = DataStore.getStaffData();
        const searchTerm = document.getElementById('staff-search').value.toLowerCase().trim();
        const tableBody = document.getElementById('staff-table-body');
        
        const filteredData = staffData.filter(staff => {
            const recordId = (staff.id || '').toLowerCase();
            const recordName = (staff.name || '').toLowerCase();
            const recordDept = (staff.department || '').toLowerCase();
            const recordDean = (staff.dean || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            
            return recordId.includes(term) ||
                recordName.includes(term) ||
                recordDept.includes(term) ||
                recordDean.includes(term);
        });
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                <td>暂无匹配的职工信息</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        filteredData.forEach(staff => {
            html += `
                <tr>
                <td>${staff.id}</td>
                <td>${staff.name}</td>
                <td>${staff.department}</td>
                <td>${staff.status}</td>
                <td>${staff.dean}</td>
                <td>
                    <button onclick="StaffManager.editStaff('${staff.id}')" class="editstaff-btn">
                    <i class="fa fa-pencil"></i> 编辑
                    </button>
                    <button onclick="StaffManager.deleteStaff('${staff.id}')" class="deletestaff-btn">
                    <i class="fa fa-trash"></i> 删除
                    </button>
                </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },

    formatDateForFileName() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    exportStaffExcel() {
        const staffData = DataStore.getStaffData();
        if (staffData.length === 0) {
            Notification.show('暂无职工数据可导出', 'warning');
            return;
        }
        
        const exportData = staffData.map(staff => {
            return {
                '工号': staff.id,
                '姓名': staff.name,
                '科室': staff.department,
                '状态': staff.status,
                '分管': staff.dean
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '职工信息');
        
        const fileName = `职工信息表_${this.formatDateForFileName()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        Notification.show('职工信息导出成功', 'success');
    },
    
    // 替代方法
    getStaffById(id) {
        const staffData = DataStore.getStaffData();
        return staffData.find(staff => staff.id === id) || null;
    }
};

const AttendanceManager = {
    init() {
        this.renderAttendanceList();
        
        this.renderArrangedData();
        
        document.getElementById('attendance-search').addEventListener('input', () => {
            this.renderAttendanceList();
        });
        
        document.getElementById('attendance-month-filter').addEventListener('change', () => {
            this.renderAttendanceList();
        });
        
        document.getElementById('attendance-export').addEventListener('click', () => {
            this.exportAttendanceExcel();
        });
        
        document.getElementById('attendance-delete-month').addEventListener('click', () => {
            this.deleteAttendanceByMonth();
        });
        
        document.getElementById('attendance-add-blank').addEventListener('click', () => {
            this.addBlankAttendanceTable();
        });
        
        document.getElementById('arrange-search').addEventListener('input', () => {
            this.renderArrangedData();
        });
        
        document.getElementById('arrange-month-filter').addEventListener('change', () => {
            this.renderArrangedData();
        });
        
        document.getElementById('arrange-export').addEventListener('click', () => {
            this.exportArrangedExcel();
        });
        
        document.getElementById('arrange-delete-month').addEventListener('click', () => {
            this.deleteArrangedByMonth();
        });
        
        document.getElementById('select-file-btn').addEventListener('click', () => {
            document.getElementById('attendance-file').click();
        });
        
        document.getElementById('attendance-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('file-name').textContent = file.name;
                document.getElementById('file-info').style.display = 'block';
            }                    
        });
        
        document.getElementById('remove-file').addEventListener('click', () => {
            document.getElementById('attendance-file').value = '';
            document.getElementById('file-info').classList.add('hidden');
        });
        
        document.getElementById('upload-confirm').addEventListener('click', () => {
            this.uploadAttendanceFile();
        });
        
        const dropArea = document.getElementById('drop-area');
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('border-primary', 'bg-primary/5');
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('border-primary', 'bg-primary/5');
        });
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('border-primary', 'bg-primary/5');
            const file = e.dataTransfer.files[0];
            if (file) {
                document.getElementById('attendance-file').files = e.dataTransfer.files;
                document.getElementById('file-name').textContent = file.name;
                document.getElementById('file-info').classList.remove('hidden');
            }
        });
        
        document.getElementById('close-attendance-modal').addEventListener('click', () => {
            document.getElementById('edit-attendance-modal').classList.remove('show');
        });
        document.getElementById('cancel-attendance-edit').addEventListener('click', () => {
            document.getElementById('edit-attendance-modal').classList.remove('show');
        });
        
        document.getElementById('edit-attendance-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAttendance();
            document.getElementById('edit-attendance-modal').classList.remove('show');
        });
        
        document.querySelectorAll('.dean-search').forEach(input => {
            input.addEventListener('input', function() {
                const deanPage = this.closest('.dean-page');
                const deanName = deanPage.dataset.dean;
                DeanPage.renderDeanData(deanName);
            });
        });
        
        document.querySelectorAll('.dean-month-filter').forEach(input => {
            input.addEventListener('change', function() {
                const deanPage = this.closest('.dean-page');
                const deanName = deanPage.dataset.dean;
                DeanPage.renderDeanData(deanName);
            });
        });
        
        document.querySelectorAll('.dean-export').forEach(button => {
            button.addEventListener('click', function() {
                const deanPage = this.closest('.dean-page');
                const deanName = deanPage.dataset.dean;
                DeanPage.exportDeanExcel(deanName);
            });
        });
    },
    
    uploadAttendanceFile() {
        const fileInput = document.getElementById('attendance-file');
        const file = fileInput.files[0];
        
        if (!file) {
            Notification.show('请先选择要上传的文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        reader.onload = function(e) {
            try {
                let attendanceRecords;
                
                if (fileExtension === 'txt') {
                    attendanceRecords = FileHandler.parseTxtFile(e.target.result);
                } else if (['xlsx', 'csv'].includes(fileExtension)) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    attendanceRecords = FileHandler.parseExcelFile(workbook);
                } else {
                    Notification.show('不支持的文件格式', 'error');
                    return;
                }
                
                if (attendanceRecords.length === 0) {
                    Notification.show('未解析到有效考勤数据', 'warning');
                    return;
                }
                
                AttendanceManager.saveAttendanceRecords(attendanceRecords);
                
                fileInput.value = '';
                document.getElementById('file-info').classList.add('hidden');
                Notification.show(`成功上传${attendanceRecords.length}条考勤记录`, 'success');
            } catch (error) {
                console.error('上传考勤文件失败:', error);
                Notification.show('上传考勤文件失败，请重试', 'error');
            }
        };
        
        if (fileExtension === 'txt') {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    },
    
    saveAttendanceRecords(records) {
        let attendanceData = DataStore.getAttendanceData();
        
        records.forEach(record => {
            const { date, time, id, name } = record;
            const staffInfo = StaffManager.getStaffById(id) || {
                name,
                department: '未知',
                status: '正常',
                dean: '未知'
            };
            
            let existingRecordIndex = attendanceData.findIndex(item =>
                item.id === id && item.date === date
            );
            
            if (existingRecordIndex !== -1) {
                const existingRecord = attendanceData[existingRecordIndex];
                let timeAdded = false;
                
                for (let i = 1; i <= 10; i++) {
                    const timeField = `time${i}`;
                    if (!existingRecord[timeField] || existingRecord[timeField] === '') {
                        existingRecord[timeField] = time;
                        timeAdded = true;
                        break;
                    }
                }
                
                if (!timeAdded) {
                    alert(`工号${id}在${date}的考勤时间已达10条上限,请检查后续记录`);
                }
            } else {
                const newRecord = {
                    id,
                    name: staffInfo.name,
                    department: staffInfo.department,
                    status: staffInfo.status,
                    dean: staffInfo.dean,
                    date,
                    time1: time,
                    time2: '',
                    time3: '',
                    time4: '',
                    time5: '',
                    time6: '',
                    time7: '',
                    time8: '',
                    time9: '',
                    time10: '',
                    recordId: DataStore.generateId()
                };
                attendanceData.push(newRecord);
            }
        });
        
        attendanceData.sort((a, b) => {
            if (a.id !== b.id) return a.id.localeCompare(b.id);
            return a.date.localeCompare(b.date);
        });
        
        DataStore.saveAttendanceData(attendanceData);
        
        this.arrangeAttendanceData();
        
        this.renderAttendanceList();
        this.renderArrangedData();
        
        ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
            DeanPage.renderDeanData(dean);
        });
    },

    arrangeAttendanceData() {
        const attendanceData = DataStore.getAttendanceData();
        const arrangedData = [];
        
        attendanceData.forEach(record => {
            const { id, name, department, status, dean, date } = record;
            
            const allTimes = [];
            for (let i = 1; i <= 10; i++) {
                const time = record[`time${i}`];
                if (time && time.trim() !== '') {
                    allTimes.push(time.trim());
                }
            }
            
            const isInTimeRange = (time, start, end) => {
                const timeRegex = /^(0?[1-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                if (!timeRegex.test(time)) {
                    return false;
                } 

                const timeStr = time.split(':').join('');
                const startStr = start.split(':').join('');
                const endStr = end.split(':').join('');
                return timeStr >= startStr && timeStr <= endStr;
            };
            
            let arranged = {
                id,
                name,
                department,
                status,
                dean,
                date,
                time1: '',
                time2: '',
                time3: '',
                time4: '',
                ruleIn: [],
                ruleOut: [],
                sa: '',
                problems: '',
                recordId: record.recordId
            };
            
            const usedIndexes = new Set();

            const targetMonths = [1, 2, 3, 4, 10, 11, 12];

            let recordMonth = null;

            try {
                recordMonth = new Date(arranged.date).getMonth() + 1;
            } catch (e) {
                recordMonth = null;
                Notification.show('日期格式错误，请检查考勤记录', 'error');
            }

            if (recordMonth && targetMonths.includes(recordMonth)) {
                for (let i = 0; i < allTimes.length; i++) {
                    const time = allTimes[i];
                    if (isInTimeRange(time, '05:00:00', '09:00:00')) {
                        arranged.time1 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '11:00:00', '11:30:00') ||
                        isInTimeRange(time, '12:00:00', '12:30:00')) {
                        arranged.time2 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '11:30:00', '12:00:00') ||
                        isInTimeRange(time, '13:00:00', '13:30:00')) {
                        arranged.time3 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '15:30:00', '16:00:00') ||
                        isInTimeRange(time, '16:30:00', '17:00:00')) {
                        arranged.time4 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    
                    const isRule1 = isInTimeRange(time, '05:00:00', '09:00:00');
                    const isRule2 = isInTimeRange(time, '11:00:00', '11:30:00') || isInTimeRange(time, '12:00:00', '12:30:00');
                    const isRule3 = isInTimeRange(time, '11:30:00', '12:00:00') || isInTimeRange(time, '13:00:00', '13:30:00');
                    const isRule4 = isInTimeRange(time, '15:30:00', '16:00:00') || isInTimeRange(time, '16:30:00', '17:00:00');
                    
                    if (isRule1 || isRule2 || isRule3 || isRule4) {
                        arranged.ruleIn.push(time);
                    } else {
                        arranged.ruleOut.push(time);
                    }
                }
                
            } else {
                for (let i = 0; i < allTimes.length; i++) {
                    const time = allTimes[i];
                    if (isInTimeRange(time, '05:00:00', '09:00:00')) {
                        arranged.time1 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '11:00:00', '11:30:00') ||
                        isInTimeRange(time, '12:00:00', '12:30:00')) {
                        arranged.time2 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '11:30:00', '12:00:00') ||
                        isInTimeRange(time, '13:30:00', '14:00:00')) {
                        arranged.time3 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    if (isInTimeRange(time, '16:00:00', '16:30:00') ||
                        isInTimeRange(time, '17:00:00', '17:30:00')) {
                        arranged.time4 = time;
                        usedIndexes.add(i);
                        break;
                    }
                }
                
                for (let i = 0; i < allTimes.length; i++) {
                    if (usedIndexes.has(i)) continue;
                    const time = allTimes[i];
                    
                    const isRule1 = isInTimeRange(time, '05:00:00', '09:00:00');
                    const isRule2 = isInTimeRange(time, '11:00:00', '11:30:00') || isInTimeRange(time, '12:00:00', '12:30:00');
                    const isRule3 = isInTimeRange(time, '11:30:00', '12:00:00') || isInTimeRange(time, '13:30:00', '14:00:00');
                    const isRule4 = isInTimeRange(time, '16:00:00', '16:30:00') || isInTimeRange(time, '17:00:00', '17:30:00');
                    
                    if (isRule1 || isRule2 || isRule3 || isRule4) {
                        arranged.ruleIn.push(time);
                    } else {
                        arranged.ruleOut.push(time);
                    }
                }
            }
            
            arranged.ruleIn = arranged.ruleIn.join(', ');
            arranged.ruleOut = arranged.ruleOut.join(', ');
            arrangedData.push(arranged);
        });

        arrangedData.sort((a, b) => {
            if (a.id !== b.id) return a.id.localeCompare(b.id);
            return new Date(a.date) - new Date(b.date);
        });

        const staffGroup = {};
        arrangedData.forEach(item => {
            if (!staffGroup[item.id]) {
                staffGroup[item.id] = [];
            }
            staffGroup[item.id].push(item);
        });

        const targetMonths = [1, 2, 3, 4, 10, 11, 12];

        Object.values(staffGroup).forEach(staffRecords => {
            staffRecords.forEach((current, index) => {
                if (!current.sa) current.sa = '';
                if (!current.problems) current.problems = '';

                let recordMonth = null;

                try {
                    recordMonth = new Date(current.date).getMonth() + 1;
                } catch (e) {
                    recordMonth = null;
                    Notification.show('日期格式错误，请检查考勤记录', 'error');
                }

                if (isInTimeRange(current.time1, '05:00:00', '08:00:00') && 
                    !current.time2 && !current.time3 && !current.time4) {
                    current.sa = '夜班';
                } 
                else if (index > 0) {
                    const prev = staffRecords[index - 1];
                    if (prev.sa === '夜班' && 
                        (isInTimeRange(current.time1, '08:00:00', '09:00:00') || !current.time1) && 
                        !current.time2 && !current.time3 && !current.time4) {
                        current.sa = '下夜班';
                    }
                } 

                if (recordMonth && targetMonths.includes(recordMonth)) {
                    if (!current.sa) {
                        if (isInTimeRange(current.time2, '11:00:00', '11:30:00') || 
                            isInTimeRange(current.time3, '11:30:00', '12:00:00') || 
                            isInTimeRange(current.time4, '15:30:00', '16:00:00')) {
                            current.sa = '中午班';
                        } else {
                            if (isInTimeRange(current.time2, '12:00:00', '12:30:00') || 
                                isInTimeRange(current.time3, '13:00:00', '13:30:00') || 
                                isInTimeRange(current.time4, '16:30:00', '17:00:00')) {
                                current.sa = '白班';
                            } else {
                                if (!current.time1 && !current.time2 && !current.time3 && !current.time4) {
                                    current.sa = '';
                                } else {
                                    current.sa = '未识别班次'; 
                                }
                            }
                        }
                    }
                } else {
                    if (!current.sa) {
                        if (isInTimeRange(current.time2, '11:00:00', '11:30:00') || 
                            isInTimeRange(current.time3, '11:30:00', '12:00:00') || 
                            isInTimeRange(current.time4, '16:00:00', '16:30:00')) {
                            current.sa = '中午班';
                        } else {
                            if (isInTimeRange(current.time2, '12:00:00', '12:30:00') || 
                                isInTimeRange(current.time3, '13:30:00', '14:00:00') || 
                                isInTimeRange(current.time4, '17:00:00', '17:30:00')) {
                                current.sa = '白班';
                            } else {
                                if (!current.time1 && !current.time2 && !current.time3 && !current.time4) {
                                    current.sa = '';
                                } else {
                                    current.sa = '未识别班次'; 
                                }
                            }
                        }
                    }
                }

                if ((current.sa === '夜班' || current.sa === '下夜班') && !current.time1) {
                    current.problems = '08:00未考勤';
                } else {
                    current.problems = '';
                }

                if (!current.problems) {
                    if (!current.time1 && !current.time2 && !current.time3 && !current.time4) {
                        current.problems = '全天未考勤';
                    }
                }

                if (recordMonth && targetMonths.includes(recordMonth)) {
                    if (!current.problems && current.sa === '中午班') {
                        if ((!current.time1 && !current.time2 && !current.time3) || (!current.time1 && !current.time2 && !current.time4) || (!current.time1 && !current.time3 && !current.time4)) {
                            current.problems = '请核对考勤';
                        } else {
                            if (!current.time1 && !current.time2) {
                                current.problems = '上午未考勤';
                            } else {
                                if (!current.time1 && !current.time3) {
                                    current.problems = '08:00、11:30未考勤';
                                } else {
                                    if (!current.time1 && !current.time4) {
                                        current.problems = '08:00、15:30未考勤';
                                    } else {
                                        if (!current.time2 && !current.time3) {
                                            current.problems = '11:00、11:30未考勤';
                                        } else {
                                            if (!current.time2 && !current.time4) {
                                                current.problems = '11:00、15:30未考勤';
                                            } else {
                                                if (!current.time3 && !current.time4) {
                                                    current.problems = current.time2 + ',下午未考勤';
                                                } else {
                                                    if (!current.time1) {
                                                        current.problems = '08:00未考勤';
                                                    } else {
                                                        if (!current.time2) {
                                                            current.problems = '11:00未考勤';
                                                        } else {
                                                            if (!current.time3) {
                                                                current.problems = '11:30未考勤';
                                                            } else {
                                                                if (!current.time4) {
                                                                    current.problems = '15:30未考勤';
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!current.problems && current.sa === '白班') {
                        if (!current.time1 && !current.time2 && !current.time3) {
                            current.problems = '上午未考勤,13:00未考勤';
                        } else {
                            if (!current.time1 && !current.time2 && !current.time4) {
                                current.problems = '上午未考勤,16:30未考勤';
                            } else {
                                if (!current.time1 && !current.time3 && !current.time4) {
                                    current.problems = '08:00未考勤,下午未考勤';
                                } else {
                                    if (!current.time2 && !current.time3 && !current.time4) {
                                        current.problems = '12:00未考勤,下午未考勤';
                                    } else {
                                        if (!current.time1 && !current.time2) {
                                            current.problems = '上午未考勤';
                                        } else {
                                            if (!current.time1 && !current.time3) {
                                                current.problems = '08:00、13:00未考勤';
                                            } else {
                                                if (!current.time1 && !current.time4) {
                                                    current.problems = '08:00、16:30未考勤';
                                                } else {
                                                    if (!current.time2 && !current.time3) {
                                                        current.problems = '12:00、13:00未考勤';
                                                    } else {
                                                        if (!current.time2 && !current.time4) {
                                                            current.problems = '12:00、16:30未考勤';
                                                        } else {
                                                            if (!current.time3 && !current.time4) {
                                                                current.problems = '下午未考勤';
                                                            } else {
                                                                if (!current.time1) {
                                                                    current.problems = '08:00未考勤';
                                                                } else {
                                                                    if (!current.time2) {
                                                                        current.problems = '12:00未考勤';
                                                                    } else {
                                                                        if (!current.time3) {
                                                                            current.problems = '13:00未考勤';
                                                                        } else {
                                                                            if (!current.time4) {
                                                                                current.problems = '16:30未考勤';
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (!current.problems && current.sa === '中午班') {
                        if ((!current.time1 && !current.time2 && !current.time3) || (!current.time1 && !current.time2 && !current.time4) || (!current.time1 && !current.time3 && !current.time4)) {
                            current.problems = '请核对考勤';
                        } else {
                            if (!current.time1 && !current.time2) {
                                current.problems = '上午未考勤';
                            } else {
                                if (!current.time1 && !current.time3) {
                                    current.problems = '08:00、11:30未考勤';
                                } else {
                                    if (!current.time1 && !current.time4) {
                                        current.problems = '08:00、16:00未考勤';
                                    } else {
                                        if (!current.time2 && !current.time3) {
                                            current.problems = '11:00、11:30未考勤';
                                        } else {
                                            if (!current.time2 && !current.time4) {
                                                current.problems = '11:00、16:00未考勤';
                                            } else {
                                                if (!current.time3 && !current.time4) {
                                                    current.problems = current.time2 + ',下午未考勤';
                                                } else {
                                                    if (!current.time1) {
                                                        current.problems = '08:00未考勤';
                                                    } else {
                                                        if (!current.time2) {
                                                            current.problems = '11:00未考勤';
                                                        } else {
                                                            if (!current.time3) {
                                                                current.problems = '11:30未考勤';
                                                            } else {
                                                                if (!current.time4) {
                                                                    current.problems = '16:00未考勤';
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!current.problems && current.sa === '白班') {
                        if (!current.time1 && !current.time2 && !current.time3) {
                            current.problems = '上午未考勤,13:30未考勤';
                        } else {
                            if (!current.time1 && !current.time2 && !current.time4) {
                                current.problems = '上午未考勤,17:00未考勤';
                            } else {
                                if (!current.time1 && !current.time3 && !current.time4) {
                                    current.problems = '08:00未考勤,下午未考勤';
                                } else {
                                    if (!current.time2 && !current.time3 && !current.time4) {
                                        current.problems = '12:00未考勤,下午未考勤';
                                    } else {
                                        if (!current.time1 && !current.time2) {
                                            current.problems = '上午未考勤';
                                        } else {
                                            if (!current.time1 && !current.time3) {
                                                current.problems = '08:00、13:30未考勤';
                                            } else {
                                                if (!current.time1 && !current.time4) {
                                                    current.problems = '08:00、17:00未考勤';
                                                } else {
                                                    if (!current.time2 && !current.time3) {
                                                        current.problems = '12:00、13:30未考勤';
                                                    } else {
                                                        if (!current.time2 && !current.time4) {
                                                            current.problems = '12:00、17:00未考勤';
                                                        } else {
                                                            if (!current.time3 && !current.time4) {
                                                                current.problems = '下午未考勤';
                                                            } else {
                                                                if (!current.time1) {
                                                                    current.problems = '08:00未考勤';
                                                                } else {
                                                                    if (!current.time2) {
                                                                        current.problems = '12:00未考勤';
                                                                    } else {
                                                                        if (!current.time3) {
                                                                            current.problems = '13:30未考勤';
                                                                        } else {
                                                                            if (!current.time4) {
                                                                                current.problems = '17:00未考勤';
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        DataStore.saveArrangedData(arrangedData);

        function isInTimeRange(time, start, end) {
            if (!time) return false;
            const timeRegex = /^(0?[1-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(time)) {
                return false;
            } 

            const timeStr = time.split(':').join('');
            const startStr = start.split(':').join('');
            const endStr = end.split(':').join('');
            return timeStr >= startStr && timeStr <= endStr;
        }
    },
    
    addBlankAttendanceTable() {
        const now = new Date();
        let nian = now.getFullYear();
        let yue = now.getMonth();
        if (yue === 0) { nian--; yue = 12; }
        const monthStr = yue.toString().padStart(2, '0');
        const LastMonth = `${nian}-${monthStr}`;
        
        const month = prompt('请输入要添加空白表的月份（格式：YYYY-MM）', LastMonth);
        if (!month) return;
        
        if (!/^\d{4}-\d{2}$/.test(month)) {
            Notification.show('月份格式不正确，请输入 YYYY-MM 格式', 'error');
            return;
        }
        
        const [year, monthNum] = month.split('-').map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const staffData = DataStore.getStaffData();
        
        if (staffData.length === 0) {
            Notification.show('暂无职工信息，请先添加职工', 'error');
            return;
        }
        
        let attendanceData = DataStore.getAttendanceData();
        let addedCount = 0;
        
        staffData.forEach(staff => {
            for (let day = 1; day <= daysInMonth; day++) {
                const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const exists = attendanceData.some(record =>
                    record.id === staff.id && record.date === date
                );
                
                if (!exists) {
                    const newRecord = {
                        id: staff.id,
                        name: staff.name,
                        department: staff.department,
                        status: staff.status,
                        dean: staff.dean,
                        date,
                        time1: '',
                        time2: '',
                        time3: '',
                        time4: '',
                        time5: '',
                        time6: '',
                        time7: '',
                        time8: '',
                        time9: '',
                        time10: '',
                        recordId: DataStore.generateId()
                    };
                    attendanceData.push(newRecord);
                    addedCount++;
                }
            }
        });
        
        DataStore.saveAttendanceData(attendanceData);
        
        this.arrangeAttendanceData();
        
        this.renderAttendanceList();
        this.renderArrangedData();
        Notification.show(`成功添加${addedCount}条空白考勤记录`, 'success');
    },
    
    renderAttendanceList() {
        const attendanceData = DataStore.getAttendanceData();
        const searchTerm = document.getElementById('attendance-search').value.toLowerCase().trim();
        const monthFilter = document.getElementById('attendance-month-filter').value;
        const tableBody = document.getElementById('attendance-table-body');
        
        const filteredData = attendanceData.filter(record => {
            if (monthFilter && !record.date.startsWith(monthFilter)) {
                return false;
            }
            
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm) ||
                    record.dean.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                <td>暂无匹配的考勤信息</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        filteredData.forEach(record => {
            html += `
                <tr>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.department}</td>
                <td>${record.status}</td>
                <td>${record.dean}</td>
                <td>${record.date}</td>
                <td>${record.time1 || ''}</td>
                <td>${record.time2 || ''}</td>
                <td>${record.time3 || ''}</td>
                <td>${record.time4 || ''}</td>
                <td>${record.time5 || ''}</td>
                <td>${record.time6 || ''}</td>
                <td>${record.time7 || ''}</td>
                <td>${record.time8 || ''}</td>
                <td>${record.time9 || ''}</td>
                <td>${record.time10 || ''}</td>
                <td>
                    <button onclick="AttendanceManager.editAttendance('${record.recordId}')" class="editattendance-btn">
                    <i class="fa fa-pencil"></i> 编辑
                    </button>
                    <button onclick="AttendanceManager.deleteAttendance('${record.recordId}')" class="deleteattendance-btn">
                    <i class="fa fa-trash"></i> 删除
                    </button>
                </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },
    
    renderArrangedData() {
        const arrangedData = DataStore.getArrangedData();
        const searchTerm = document.getElementById('arrange-search').value.toLowerCase().trim();
        const monthFilter = document.getElementById('arrange-month-filter').value;
        const tableBody = document.getElementById('arrange-table-body');
        
        const filteredData = arrangedData.filter(record => {
            if (monthFilter && !record.date.startsWith(monthFilter)) {
                return false;
            }
            
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm) ||
                    record.dean.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                <td>暂无匹配的整理数据</td>
                </tr>
            `;
            return;
        }

        let html = '';
        filteredData.forEach(record => {
            html += `
                <tr>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.department}</td>
                <td>${record.status}</td>
                <td>${record.dean}</td>
                <td>${record.date}</td>
                <td>${record.time1 || ''}</td>
                <td>${record.time2 || ''}</td>
                <td>${record.time3 || ''}</td>
                <td>${record.time4 || ''}</td>
                <td title="${record.ruleIn}">${record.ruleIn || ''}</td>
                <td title="${record.ruleOut}">${record.ruleOut || ''}</td>
                <td>${record.sa || ''}</td>
                <td>${record.problems || ''}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },
    
    editAttendance(recordId) {
        const attendanceData = DataStore.getAttendanceData();
        const record = attendanceData.find(r => r.recordId === recordId);
        
        if (record) {
            document.getElementById('edit-attendance-record-id').value = record.recordId;
            document.getElementById('edit-attendance-id').value = record.id;
            document.getElementById('edit-attendance-name').value = record.name;
            document.getElementById('edit-attendance-department').value = record.department;
            document.getElementById('edit-attendance-status').value = record.status;
            document.getElementById('edit-attendance-dean').value = record.dean;
            document.getElementById('edit-attendance-date').value = record.date;
            
            for (let i = 1; i <= 10; i++) {
                const timeValue = record[`time${i}`] || '';
                document.getElementById(`edit-attendance-time${i}`).value = timeValue;
            }
            
            document.getElementById('edit-attendance-modal').classList.add('show');
        }
    },
    
    updateAttendance() {
        const recordId = document.getElementById('edit-attendance-record-id').value;
        const date = document.getElementById('edit-attendance-date').value;
        
        if (!date) {
            Notification.show('请选择日期', 'error');
            return;
        }
        
        const timeData = {};
        for (let i = 1; i <= 10; i++) {
            timeData[`time${i}`] = document.getElementById(`edit-attendance-time${i}`).value || '';
        }
        
        let attendanceData = DataStore.getAttendanceData();
        const index = attendanceData.findIndex(r => r.recordId === recordId);
        
        if (index !== -1) {
            attendanceData[index] = {
                ...attendanceData[index],
                date,
                ...timeData
            };
            
            DataStore.saveAttendanceData(attendanceData);
            
            this.arrangeAttendanceData();
            
            this.renderAttendanceList();
            this.renderArrangedData();
            
            ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
                DeanPage.renderDeanData(dean);
            });
            
            document.getElementById('edit-attendance-modal').classList.add('show');
            Notification.show('考勤信息更新成功', 'success');
        }
    },
    
    deleteAttendance(recordId) {
        if (confirm('确定要删除该考勤记录吗？')) {
            let attendanceData = DataStore.getAttendanceData();
            attendanceData = attendanceData.filter(r => r.recordId !== recordId);
            DataStore.saveAttendanceData(attendanceData);
            
            let arrangedData = DataStore.getArrangedData();
            arrangedData = arrangedData.filter(r => r.recordId !== recordId);
            DataStore.saveArrangedData(arrangedData);
            
            this.renderAttendanceList();
            this.renderArrangedData();
            
            ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
                DeanPage.renderDeanData(dean);
            });
            
            Notification.show('考勤记录已删除', 'success');
        }
    },
    
    deleteAttendanceByStaffId(staffId) {
        let attendanceData = DataStore.getAttendanceData();
        attendanceData = attendanceData.filter(r => r.id !== staffId);
        DataStore.saveAttendanceData(attendanceData);
        
        let arrangedData = DataStore.getArrangedData();
        arrangedData = arrangedData.filter(r => r.id !== staffId);
        DataStore.saveArrangedData(arrangedData);
        
        this.renderAttendanceList();
        this.renderArrangedData();
        
        ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
            DeanPage.renderDeanData(dean);
        });
    },

    deleteAttendanceByMonth() {
        const month = document.getElementById('attendance-month-filter').value;

        if (!month) {
            if (confirm('警告：确定要删除【所有月份】的全部考勤记录吗？此操作不可恢复！')) {
                let attendanceData = DataStore.getAttendanceData();
                const originalCount = attendanceData.length;
                attendanceData = [];
                DataStore.saveAttendanceData(attendanceData);
                
                let arrangedData = DataStore.getArrangedData();
                arrangedData = [];
                DataStore.saveArrangedData(arrangedData);
                
                const deletedCount = originalCount;
                
                this.renderAttendanceList();
                this.renderArrangedData();
                
                ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
                    DeanPage.renderDeanData(dean);
                });
                
                Notification.show(`成功删除所有考勤记录，共${deletedCount}条`, 'success');
            }
            return;
        }

        if (confirm(`确定要删除${month}月份的所有考勤记录吗？`)) {
            let attendanceData = DataStore.getAttendanceData();
            const originalCount = attendanceData.length;
            attendanceData = attendanceData.filter(r => !r.date.startsWith(month));
            DataStore.saveAttendanceData(attendanceData);
            
            let arrangedData = DataStore.getArrangedData();
            arrangedData = arrangedData.filter(r => !r.date.startsWith(month));
            DataStore.saveArrangedData(arrangedData);
            
            const deletedCount = originalCount - attendanceData.length;
            
            this.renderAttendanceList();
            this.renderArrangedData();
            
            ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
                DeanPage.renderDeanData(dean);
            });
            
            Notification.show(`成功删除${month}月份${deletedCount}条考勤记录`, 'success');
        }
    },
    
    deleteArrangedByMonth() {
        const month = document.getElementById('arrange-month-filter').value;
        if (!month) {
            Notification.show('请先选择要删除的月份', 'error');
            return;
        }
        
        if (confirm(`确定要删除${month}月份的所有整理记录吗？考勤原始数据不会被删除`)) {
            let arrangedData = DataStore.getArrangedData();
            const originalCount = arrangedData.length;
            arrangedData = arrangedData.filter(r => !r.date.startsWith(month));
            DataStore.saveArrangedData(arrangedData);
            
            const deletedCount = originalCount - arrangedData.length;
            
            this.renderArrangedData();
            
            ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(dean => {
                DeanPage.renderDeanData(dean);
            });
            
            Notification.show(`成功删除${month}月份${deletedCount}条整理记录`, 'success');
        }
    },
    
    updateStaffInfoInAttendance(staffId, name, department, status, dean) {
        let attendanceData = DataStore.getAttendanceData();
        attendanceData = attendanceData.map(record => {
            if (record.id === staffId) {
                return {
                    ...record,
                    name,
                    department,
                    status,
                    dean
                };
            }
            return record;
        });
        DataStore.saveAttendanceData(attendanceData);
        
        let arrangedData = DataStore.getArrangedData();
        arrangedData = arrangedData.map(record => {
            if (record.id === staffId) {
                return {
                    ...record,
                    name,
                    department,
                    status,
                    dean
                };
            }
            return record;
        });
        DataStore.saveArrangedData(arrangedData);
        
        this.renderAttendanceList();
        this.renderArrangedData();
        
        ['王雷', '李春娟', '宋增信', '徐伟', '段海燕', '财务'].forEach(deanName => {
            DeanPage.renderDeanData(deanName);
        });
    },

    formatMonth() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    
    exportAttendanceExcel() {
        const attendanceData = DataStore.getAttendanceData();
        const searchTerm = document.getElementById('attendance-search').value.toLowerCase().trim();
        const monthFilter = document.getElementById('attendance-month-filter').value;
        
        const filteredData = attendanceData.filter(record => {
            if (monthFilter && !record.date.startsWith(monthFilter)) {
                return false;
            }
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm) ||
                    record.dean.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            Notification.show('暂无匹配的考勤数据可导出', 'warning');
            return;
        }
        
        const exportData = filteredData.map(record => {
            return {
                '工号': record.id,
                '姓名': record.name,
                '科室': record.department,
                '状态': record.status,
                '分管': record.dean,
                '日期': record.date,
                '考勤时间 1': record.time1 || '',
                '考勤时间 2': record.time2 || '',
                '考勤时间 3': record.time3 || '',
                '考勤时间 4': record.time4 || '',
                '考勤时间 5': record.time5 || '',
                '考勤时间 6': record.time6 || '',
                '考勤时间 7': record.time7 || '',
                '考勤时间 8': record.time8 || '',
                '考勤时间 9': record.time9 || '',
                '考勤时间 10': record.time10 || ''
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '考勤信息');
        
        const fileName = `${this.formatMonth()}考勤信息表.xlsx`;
        XLSX.writeFile(workbook, fileName);
        Notification.show('考勤信息导出成功', 'success');
    },
    
    exportArrangedExcel() {
        const arrangedData = DataStore.getArrangedData();
        const searchTerm = document.getElementById('arrange-search').value.toLowerCase().trim();
        const monthFilter = document.getElementById('arrange-month-filter').value;
        
        const filteredData = arrangedData.filter(record => {
            if (monthFilter && !record.date.startsWith(monthFilter)) {
                return false;
            }
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm) ||
                    record.dean.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            Notification.show('暂无匹配的整理数据可导出', 'warning');
            return;
        }
        
        const exportData = filteredData.map(record => {
            return {
                '工号': record.id,
                '姓名': record.name,
                '科室': record.department,
                '状态': record.status,
                '分管': record.dean,
                '日期': record.date,
                '考勤时间 1': record.time1 || '',
                '考勤时间 2': record.time2 || '',
                '考勤时间 3': record.time3 || '',
                '考勤时间 4': record.time4 || '',
                '规则内考勤': record.ruleIn || '',
                '规则外考勤': record.ruleOut || '',
                '班次': record.sa || '',
                '问题': record.problems || ''
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '整理后考勤信息');
        
        const fileName = `${this.formatMonth()}考勤记录整理表.xlsx`;
        XLSX.writeFile(workbook, fileName);
        Notification.show('整理后考勤信息导出成功', 'success');
    }
};

const DeanPage = {
    renderDeanData(deanName) {
        const arrangedData = DataStore.getArrangedData();
        const deanPage = document.getElementById(`dean-${deanName}`);
        const searchInput = deanPage.querySelector('.dean-search');
        const monthFilter = deanPage.querySelector('.dean-month-filter').value;
        const tableBody = deanPage.querySelector('.dean-table-body');
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const filteredData = arrangedData.filter(record => {
            if (record.dean !== deanName) return false;
            if (monthFilter && !record.date.startsWith(monthFilter)) return false;
            
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr class="text-center">
                <td colspan="11" class="px-4 py-8 text-gray-500">暂无相关考勤数据</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        filteredData.forEach(record => {
            html += `
                <tr>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.department}</td>
                <td>${record.status}</td>
                <td>${record.date}</td>
                <td>${record.time1 || ''}</td>
                <td>${record.time2 || ''}</td>
                <td>${record.time3 || ''}</td>
                <td>${record.time4 || ''}</td>
                <td title="${record.ruleIn}">${record.ruleIn || ''}</td>
                <td title="${record.ruleOut}">${record.ruleOut || ''}</td>
                <td>${record.sa || ''}</td>
                <td>${record.problems || ''}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },

    formatMonth() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },
    
    exportDeanExcel(deanName) {
        const arrangedData = DataStore.getArrangedData();
        const deanPage = document.getElementById(`dean-${deanName}`);
        const searchInput = deanPage.querySelector('.dean-search');
        const monthFilter = deanPage.querySelector('.dean-month-filter').value;
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const filteredData = arrangedData.filter(record => {
            if (record.dean !== deanName) return false;
            if (monthFilter && !record.date.startsWith(monthFilter)) return false;
            
            return record.date.toLowerCase().includes(searchTerm) ||
                    record.id.toLowerCase().includes(searchTerm) ||
                    record.name.toLowerCase().includes(searchTerm) ||
                    record.department.toLowerCase().includes(searchTerm);
        });
        
        if (filteredData.length === 0) {
            Notification.show('暂无相关考勤数据可导出', 'warning');
            return;
        }
        
        const exportData = filteredData.map(record => {
            return {
                '工号': record.id,
                '姓名': record.name,
                '科室': record.department,
                '状态': record.status,
                '日期': record.date,
                '考勤时间 1': record.time1 || '',
                '考勤时间 2': record.time2 || '',
                '考勤时间 3': record.time3 || '',
                '考勤时间 4': record.time4 || '',
                '规则内考勤': record.ruleIn || '',
                '规则外考勤': record.ruleOut || '',
                '班次': record.sa || '',
                '问题': record.problems || ''
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${deanName}分管考勤`);
        
        const fileName = `${this.formatMonth()}分管考勤表（${deanName}）.xlsx`;
        XLSX.writeFile(workbook, fileName);
        Notification.show(`${deanName}分管考勤表导出成功`, 'success');
    }
};

const ViewAttendance = {
    init() {
        this.monthInput = document.getElementById('view-month-filter');
        this.deptSelect = document.querySelector('#view-page .dep-sel select');
        this.tbody = document.getElementById('viewAttendanceTbody');
        this.dateHeaderTr = document.getElementById('viewDateHeaderTr'); 

        if (!this.monthInput || !this.deptSelect || !this.tbody) return;
        
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const defaultMonth = lastMonth.getFullYear() + '-' + (lastMonth.getMonth() + 1).toString().padStart(2, '0');
        this.monthInput.value = defaultMonth;
        
        this.bindEvents();
        this.renderTable();
    },

    bindEvents() {
        this.monthInput.addEventListener('change', () => this.renderTable());
        this.deptSelect.addEventListener('change', () => this.renderTable());
        document.addEventListener('arrangedDataUpdated', () => this.renderTable());
    },

    renderTable() {
        if (!this.monthInput || !this.deptSelect || !this.tbody) return;
        
        const selectedMonth = this.monthInput.value;
        const selectedDept = this.deptSelect.value;
        this.tbody.innerHTML = '';
        this.renderDateHeader(selectedMonth);
        const arrangedData = DataStore.getArrangedData();
        const filteredData = arrangedData.filter(item => 
            item.department === selectedDept && item.date.startsWith(selectedMonth)
        );

        if (filteredData.length === 0) {
            this.tbody.innerHTML = `
                <tr class="view-empty-row">
                    <td colspan="32" class="view-empty-cell">
                        暂无【${selectedDept}】${selectedMonth}月份的考勤数据
                    </td>
                </tr>
            `;
            return;
        }

        const staffGroup = this.groupDataByStaff(filteredData);
        Object.keys(staffGroup).forEach(staffName => {
            const staffAttendance = staffGroup[staffName];
            this.renderStaffRow(staffName, staffAttendance, selectedMonth);
        });
    },

    renderDateHeader(selectedMonth) {
        this.dateHeaderTr.innerHTML = '';
        const nameTh = document.createElement('th');
        nameTh.textContent = '姓名';
        this.dateHeaderTr.appendChild(nameTh);
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= 31; day++) {
            const dayTh = document.createElement('th');
            dayTh.textContent = day;
            if (day > daysInMonth) {
                dayTh.style.color = '#f9fafb';
                dayTh.style.pointerEvents = 'none';
            }
            this.dateHeaderTr.appendChild(dayTh);
        }
    },

    groupDataByStaff(data) {
        return data.reduce((group, item) => {
            if (!group[item.name]) {
                group[item.name] = [];
            }
            group[item.name].push(item);
            return group;
        }, {});
    },

    renderStaffRow(staffName, attendanceList, selectedMonth) {
        const tr = document.createElement('tr');
        tr.className = 'view-table-row';
        const nameTd = document.createElement('td');
        nameTd.textContent = staffName;
        tr.appendChild(nameTd);

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= 31; day++) {
            const td = document.createElement('td');
            if (day > daysInMonth) {
                td.style.background = 'white';
                td.style.color = '#ddd';
                tr.appendChild(td);
                continue;
            }
            const currentDate = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
            const dayData = attendanceList.find(item => item.date === currentDate) || { sa: '', problems: '' };
            const { statusClass, statusText } = this.getAttendanceStatus(dayData.sa, dayData.problems);
            td.className = statusClass;
            td.textContent = statusText;
            tr.appendChild(td);
        }

        this.tbody.appendChild(tr);
    },

    getAttendanceStatus(shiftType, problem) {
        if (shiftType === '夜班') {
            return { statusClass: 'att-status-night', statusText: '夜' };
        }
        else if (shiftType === '下夜班') {
            return { statusClass: 'att-status-next', statusText: '下' };
        }
        else {
            if (problem === '全天未考勤') {
                return { statusClass: 'att-status-absent', statusText: '休' };
            }
            else if (problem.includes('上午未考勤') || problem.includes('下午未考勤')) {
                return { statusClass: 'att-status-half', statusText: '半' };
            }
            else {
                return { statusClass: 'att-status-normal', statusText: '√' };
            }
        }
    }
};


window.StaffManager = StaffManager;
window.AttendanceManager = AttendanceManager;
window.DeanPage = DeanPage;
window.ViewAttendance = ViewAttendance;

document.addEventListener('DOMContentLoaded', () => {
    PageSwitcher.init();
    StaffManager.init();
    AttendanceManager.init();
    ViewAttendance.init();

    const originalArrange = AttendanceManager.arrangeAttendanceData;
    AttendanceManager.arrangeAttendanceData = function() {
        originalArrange.call(this);
        document.dispatchEvent(new CustomEvent('arrangedDataUpdated'));
    };
});