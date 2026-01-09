import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

console.log('=== 应用启动 ===');
console.log('Main.js loaded successfully');
console.log('Tauri invoke function:', typeof invoke);
console.log('Is Tauri environment:', isTauri());
console.log('window.__TAURI_INTERNALS__:', typeof window.__TAURI_INTERNALS__);

// 应用状态
let records = [];

// waitForTauri 检查已被移除，在 ESM 模式下直接调用


// 初始化应用
async function init() {
  console.log('\n=== 初始化应用 ===');
  console.log('开始初始化...');

  try {
    // 直接开始初始化，Tauri v2 + ESM 不依赖全局变量注入
    console.log('Tauri v2 ESM mode active');


    // 设置默认时间为当前时间
    console.log('1. 设置默认时间');
    setCurrentTime();

    // 加载历史记录
    console.log('2. 加载历史记录');
    await loadRecords();

    // 绑定事件
    console.log('3. 绑定表单事件');
    const form = document.getElementById('feedingForm');
    if (form) {
      form.addEventListener('submit', handleSubmit);
      console.log('✓ 表单事件监听器已绑定');
    } else {
      console.error('✗ 错误：找不到表单元素！');
    }

    // 绑定删除按钮事件（事件委托）
    const recordsList = document.getElementById('recordsList');
    if (recordsList) {
      recordsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
          const id = parseInt(e.target.dataset.id);
          deleteRecord(id);
        }
      });
    }

    // 每分钟更新一次时间输入框
    setInterval(setCurrentTime, 60000);

    console.log('✓ 应用初始化完成\n');
  } catch (error) {
    console.error('✗ 初始化失败:', error);
  }
}

// 设置当前时间
function setCurrentTime() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  document.getElementById('feedingTime').value = localTime;
}

// 处理表单提交
async function handleSubmit(e) {
  e.preventDefault();
  console.log('\n=== 提交表单 ===');
  console.log('表单提交事件触发');

  const formData = {
    feeding_type: document.getElementById('feedingType').value,
    amount: parseInt(document.getElementById('amount').value) || 0,
    duration: parseInt(document.getElementById('duration').value) || 0,
    feeding_time: document.getElementById('feedingTime').value,
    notes: document.getElementById('notes').value,
  };

  console.log('表单数据:', JSON.stringify(formData, null, 2));

  try {
    console.log('调用 Tauri 后端: add_feeding_record');
    console.log('invoke 函数类型:', typeof invoke);

    const result = await invoke('add_feeding_record', { record: formData });

    console.log('✓ 记录添加成功:', result);

    // 清空表单
    console.log('清空表单字段');
    document.getElementById('amount').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('notes').value = '';
    setCurrentTime();

    // 重新加载记录
    console.log('重新加载记录列表');
    await loadRecords();

    // 滚动到记录列表
    document.querySelector('.records').scrollIntoView({ behavior: 'smooth' });
    console.log('✓ 表单提交完成\n');
  } catch (error) {
    console.error('✗ 添加记录失败');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    console.error('完整错误:', error);
    alert('添加记录失败: ' + error);
  }
}

// 加载所有记录
async function loadRecords() {
  console.log('--- 加载记录 ---');
  try {
    console.log('调用 Tauri 后端: get_feeding_records');
    records = await invoke('get_feeding_records');
    console.log(`✓ 成功加载 ${records.length} 条记录`);

    renderRecords();
    updateStats();
  } catch (error) {
    console.error('✗ 加载记录失败');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    console.error('完整错误:', error);
    records = [];
    renderRecords();
  }
}

// 渲染记录列表
function renderRecords() {
  const recordsList = document.getElementById('recordsList');

  if (records.length === 0) {
    recordsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">还没有记录，添加第一条吧！</div>
      </div>
    `;
    return;
  }

  // 按时间倒序排列
  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.feeding_time) - new Date(a.feeding_time)
  );

  recordsList.innerHTML = sortedRecords.map((record, index) => `
    <div class="record-item">
      <div class="record-header">
        <span class="record-type">${record.feeding_type}</span>
        <span class="record-time">${formatDateTime(record.feeding_time)}</span>
      </div>
      <div class="record-details">
        ${record.amount > 0 ? `
          <div class="detail-item">
            <div class="detail-label">奶量</div>
            <div class="detail-value">${record.amount} ml</div>
          </div>
        ` : ''}
        ${record.duration > 0 ? `
          <div class="detail-item">
            <div class="detail-label">时长</div>
            <div class="detail-value">${record.duration} 分钟</div>
          </div>
        ` : ''}
      </div>
      ${record.notes ? `
        <div class="record-notes">
          <strong>备注：</strong>${escapeHtml(record.notes)}
        </div>
      ` : ''}
      <div class="record-actions">
        <button class="btn-delete" data-id="${record.id}">删除</button>
      </div>
    </div>
  `).join('');
}

// 全局变量存储待删除的 ID
let pendingDeleteId = null;

// 初始化模态框事件
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('deleteModal');
  const cancelBtn = document.getElementById('cancelDelete');
  const confirmBtn = document.getElementById('confirmDelete');

  if (modal && cancelBtn && confirmBtn) {
    //取消按钮
    cancelBtn.addEventListener('click', hideModal);

    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    // 确认按钮
    confirmBtn.addEventListener('click', async () => {
      if (pendingDeleteId !== null) {
        await executeDelete(pendingDeleteId);
        hideModal();
      }
    });
  }
});

function showModal(id) {
  pendingDeleteId = id;
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('hidden');
}

function hideModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteModal');
  modal.classList.add('hidden');
}

// 触发删除流程（点击记录上的删除按钮时调用）
async function deleteRecord(id) {
  console.log('\n=== 请求删除记录 ===');
  console.log('记录 ID:', id);
  showModal(id);
};

// 执行真正的删除操作
async function executeDelete(id) {
  try {
    console.log('调用 Tauri 后端: delete_feeding_record', id);
    await invoke('delete_feeding_record', { id });
    console.log('✓ 记录删除成功');

    await loadRecords();
    console.log('✓ 删除操作完成\n');
  } catch (error) {
    console.error('✗ 删除记录失败');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    alert('删除记录失败: ' + error);
  }
}

// 更新统计信息
function updateStats() {
  const today = new Date().toDateString();
  const todayRecords = records.filter(record =>
    new Date(record.feeding_time).toDateString() === today
  );

  const todayCount = todayRecords.length;
  const todayTotal = todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0);

  document.getElementById('todayCount').textContent = `今日：${todayCount} 次`;
  document.getElementById('todayTotal').textContent = `总量：${todayTotal} ml`;
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (recordDate.getTime() === today.getTime()) {
    return `今天 ${timeStr}`;
  } else if (recordDate.getTime() === today.getTime() - 86400000) {
    return `昨天 ${timeStr}`;
  } else {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 启动应用
init();
