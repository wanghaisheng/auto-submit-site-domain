/**
 * 集成仪表板JavaScript
 * 
 * 这个文件整合了所有仪表板功能，包括：
 * - Tab切换
 * - API调用
 * - 索引跟踪
 * - 报告分析
 * - 批量提交
 * - 定时任务
 */

// 导入API模块
import * as api from './api.js';

// 初始化仪表板
document.addEventListener('DOMContentLoaded', () => {
  console.log('集成仪表板已加载');
  
  // 初始化移动端菜单切换
  initMobileMenu();
  
  // 初始化Tab切换功能
  initTabSwitching();
  
  // 初始化复制功能
  initCopyFunctionality();
  
  // 初始化批量提交功能
  initBatchSubmission();
  
  // 初始化索引跟踪功能
  initIndexTracker();
  
  // 初始化报告功能
  initReports();
  
  // 初始化定时任务功能
  initScheduleTasks();
  
  // 加载概览数据
  loadOverviewData();
});

/**
 * 初始化Tab切换功能
 */
function initTabSwitching() {
  // 获取所有Tab按钮和内容容器
  const tabButtons = document.querySelectorAll('.sidebar-menu a[data-tab]');
  const contentContainer = document.getElementById('tab-content-container');
  
  // 如果没有找到内容容器，则退出
  if (!contentContainer) {
    console.error('找不到tab内容容器元素');
    return;
  }
  
  // 加载默认tab (overview)
  loadTabContent('overview');
  
  // 为每个Tab按钮添加点击事件
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 获取Tab ID
      const tabId = button.getAttribute('data-tab');
      
      // 移除所有活跃状态
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // 添加活跃状态到当前Tab
      button.classList.add('active');
      
      // 加载对应的tab内容
      loadTabContent(tabId);
      
      // 保存活跃Tab到localStorage
      localStorage.setItem('activeTab', tabId);
    });
  });
  
  // 从localStorage恢复活跃Tab
  const activeTab = localStorage.getItem('activeTab');
  if (activeTab) {
    const activeButton = document.querySelector(`.sidebar-menu a[data-tab="${activeTab}"]`);
    if (activeButton) {
      // 模拟点击活跃Tab按钮
      activeButton.click();
    } else {
      // 如果保存的Tab不存在，激活第一个Tab
      if (tabButtons.length > 0) {
        tabButtons[0].click();
      }
    }
  } else {
    // 如果没有保存的Tab，激活第一个Tab
    if (tabButtons.length > 0) {
      tabButtons[0].click();
    }
  }
}

/**
 * 加载tab内容
 * @param {string} tabName - 要加载的tab名称
 */
function loadTabContent(tabName) {
  const contentContainer = document.getElementById('tab-content-container');
  
  // 显示加载动画
  contentContainer.innerHTML = '<div class="loader"></div>';
  
  // 从tabs目录加载对应的HTML文件
  fetch(`./tabs/${tabName}.html`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`加载tab内容失败: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      // 替换容器内容
      contentContainer.innerHTML = html;
      
      // 初始化该tab所需的脚本
      initializeTabScripts(tabName);
    })
    .catch(error => {
      console.error('加载tab内容时出错:', error);
      contentContainer.innerHTML = `
        <div class="dashboard-header">
          <h1>错误</h1>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">加载内容时出错</h2>
          </div>
          <div style="padding: 1rem;">
            <p>无法加载 "${tabName}" 标签页内容。请稍后再试。</p>
            <p>错误详情: ${error.message}</p>
            <button class="btn btn-outline" onclick="location.reload()">
              <i class="fas fa-sync-alt"></i> 刷新页面
            </button>
          </div>
        </div>
      `;
    });
}

/**
 * 初始化特定tab所需的脚本
 * @param {string} tabName - tab名称
 */
function initializeTabScripts(tabName) {
  // 初始化图表（如果存在）
  if (tabName === 'reports' || tabName === 'overview' || tabName === 'tracker') {
    const chartElements = document.querySelectorAll('.chart-container canvas');
    if (chartElements.length > 0) {
      initializeCharts();
    }
  }
  
  // 初始化FAQ手风琴效果（如果在帮助tab）
  if (tabName === 'help') {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');
        
        // 切换当前FAQ项
        answer.classList.toggle('active');
        if (answer.classList.contains('active')) {
          icon.classList.remove('fa-chevron-down');
          icon.classList.add('fa-chevron-up');
        } else {
          icon.classList.remove('fa-chevron-up');
          icon.classList.add('fa-chevron-down');
        }
      });
    });
  }
}

/**
 * 初始化图表
 */
function initializeCharts() {
  // 查找所有需要初始化的图表
  const chartElements = document.querySelectorAll('.chart-container canvas');
  
  chartElements.forEach(canvas => {
    const chartId = canvas.id;
    
    // 根据图表ID初始化不同类型的图表
    if (chartId === 'indexingChart') {
      // 索引趋势图表
      const ctx = canvas.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
          datasets: [{
            label: '已索引URL',
            data: [120, 190, 300, 450, 600, 750],
            borderColor: '#4285f4',
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: '已提交URL',
            data: [150, 230, 380, 520, 690, 830],
            borderColor: '#34a853',
            backgroundColor: 'rgba(52, 168, 83, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: '索引趋势'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    } else if (chartId === 'performanceChart') {
      // 性能图表
      const ctx = canvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['点击率', '展示次数', '平均排名'],
          datasets: [{
            label: '本月',
            data: [2.4, 1500, 15],
            backgroundColor: '#4285f4'
          }, {
            label: '上月',
            data: [1.8, 1200, 18],
            backgroundColor: '#fbbc05'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: '性能指标'
            }
          }
        }
      });
    }
  });
}

/**
 * 初始化移动端菜单切换功能
 */
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  }
}

/**
 * 初始化复制功能
 */
function initCopyFunctionality() {
  const copyBtns = document.querySelectorAll('.btn i.fa-copy');
  copyBtns.forEach(btn => {
    const copyBtn = btn.parentElement;
    copyBtn.addEventListener('click', () => {
      const input = copyBtn.previousElementSibling;
      input.select();
      document.execCommand('copy');
      showToast('密钥已复制到剪贴板！');
    });
  });
}

/**
 * 初始化批量提交功能
 */
function initBatchSubmission() {
  // URL批量提交表单
  const batchUrlForm = document.getElementById('batch-url-form');
  if (batchUrlForm) {
    batchUrlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const urlsTextarea = document.getElementById('batch-urls');
      const urlFile = document.getElementById('url-file');
      const domain = document.getElementById('batch-domain').value;
      
      let urls = [];
      
      // 从文本框获取URL
      if (urlsTextarea.value.trim()) {
        urls = urlsTextarea.value.trim().split('\n').filter(url => url.trim());
      }
      
      // 从文件获取URL
      if (urlFile.files.length > 0) {
        const file = urlFile.files[0];
        const text = await file.text();
        const fileUrls = text.split('\n').filter(url => url.trim());
        urls = [...urls, ...fileUrls];
      }
      
      if (urls.length === 0) {
        showToast('请输入至少一个URL', 'error');
        return;
      }
      
      // 显示加载状态
      showLoading('正在提交URL...');
      
      try {
        // 调用API提交URL
        const result = await api.submitToGoogle({
          type: 'urls',
          urls: urls,
          domain: domain,
          license_key: getLicenseKey()
        });
        
        hideLoading();
        showToast(`成功提交${result.success_count}个URL`, 'success');
        
        // 刷新最近提交列表
        refreshRecentSubmissions();
      } catch (error) {
        hideLoading();
        showToast(`提交失败: ${error.message}`, 'error');
      }
    });
  }
  
  // 站点地图提交表单
  const sitemapForm = document.getElementById('sitemap-form');
  if (sitemapForm) {
    sitemapForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const sitemapUrl = document.getElementById('sitemap-url').value;
      const domain = document.getElementById('sitemap-domain').value;
      
      if (!sitemapUrl) {
        showToast('请输入站点地图URL', 'error');
        return;
      }
      
      // 显示加载状态
      showLoading('正在处理站点地图...');
      
      try {
        // 调用API提交站点地图
        const result = await api.triggerWorkflow({
          workflow: 'SITEMAP_VALIDATION',
          data: {
            sitemap_url: sitemapUrl,
            domain: domain,
            license_key: getLicenseKey()
          }
        });
        
        hideLoading();
        showToast('站点地图提交成功', 'success');
        
        // 刷新最近提交列表
        refreshRecentSubmissions();
      } catch (error) {
        hideLoading();
        showToast(`提交失败: ${error.message}`, 'error');
      }
    });
  }
}

/**
 * 初始化索引跟踪功能
 */
function initIndexTracker() {
  const trackerTab = document.getElementById('tracker-tab');
  if (trackerTab) {
    // 当切换到索引跟踪Tab时加载数据
    document.querySelector('a[data-tab="tracker"]').addEventListener('click', () => {
      loadTrackerData();
    });
    
    // 初始化URL检查表单
    const checkUrlForm = document.getElementById('check-url-form');
    if (checkUrlForm) {
      checkUrlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = document.getElementById('check-url').value;
        
        if (!url) {
          showToast('请输入要检查的URL', 'error');
          return;
        }
        
        // 显示加载状态
        showLoading('正在检查URL索引状态...');
        
        try {
          // 调用API检查URL
          const result = await api.triggerWorkflow({
            workflow: 'INDEX_CHECK',
            data: {
              url: url,
              license_key: getLicenseKey()
            }
          });
          
          hideLoading();
          
          // 显示结果
          const resultContainer = document.getElementById('index-check-result');
          if (resultContainer) {
            resultContainer.innerHTML = `
              <div class="card">
                <div class="card-header">
                  <h2 class="card-title">检查结果</h2>
                </div>
                <div class="index-result">
                  <p><strong>URL:</strong> ${url}</p>
                  <p><strong>索引状态:</strong> <span class="badge ${result.indexed ? 'success' : 'warning'}">${result.indexed ? '已索引' : '未索引'}</span></p>
                  <p><strong>检查时间:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
            `;
          }
        } catch (error) {
          hideLoading();
          showToast(`检查失败: ${error.message}`, 'error');
        }
      });
    }
  }
}

/**
 * 加载索引跟踪数据
 */
async function loadTrackerData() {
  const trackerStatsContainer = document.getElementById('tracker-stats');
  const trackerHistoryContainer = document.getElementById('tracker-history');
  
  if (!trackerStatsContainer || !trackerHistoryContainer) return;
  
  showLoading('加载索引数据...');
  
  try {
    // 调用API获取索引统计数据
    const stats = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'stats',
        license_key: getLicenseKey()
      }
    });
    
    // 更新统计数据
    trackerStatsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fas fa-check-circle"></i>
          <h3>${stats.indexed_count}</h3>
          <p>已索引URL</p>
        </div>
        <div class="stat-card">
          <i class="fas fa-times-circle"></i>
          <h3>${stats.not_indexed_count}</h3>
          <p>未索引URL</p>
        </div>
        <div class="stat-card">
          <i class="fas fa-percentage"></i>
          <h3>${stats.index_rate}%</h3>
          <p>索引率</p>
        </div>
        <div class="stat-card">
          <i class="fas fa-clock"></i>
          <h3>${stats.avg_index_time}</h3>
          <p>平均索引时间(天)</p>
        </div>
      </div>
    `;
    
    // 获取索引历史数据
    const history = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'history',
        license_key: getLicenseKey()
      }
    });
    
    // 更新历史数据表格
    let historyHtml = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>检查日期</th>
              <th>索引状态</th>
              <th>首次提交</th>
              <th>索引时间</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    history.forEach(item => {
      historyHtml += `
        <tr>
          <td>${item.url}</td>
          <td>${new Date(item.check_date).toLocaleString()}</td>
          <td><span class="badge ${item.indexed ? 'success' : 'warning'}">${item.indexed ? '已索引' : '未索引'}</span></td>
          <td>${new Date(item.submit_date).toLocaleString()}</td>
          <td>${item.index_time ? item.index_time + '天' : '-'}</td>
        </tr>
      `;
    });
    
    historyHtml += `
          </tbody>
        </table>
      </div>
    `;
    
    trackerHistoryContainer.innerHTML = historyHtml;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(`加载数据失败: ${error.message}`, 'error');
  }
}

/**
 * 初始化报告功能
 */
function initReports() {
  const reportsTab = document.getElementById('reports-tab');
  if (reportsTab) {
    // 当切换到报告Tab时加载数据
    document.querySelector('a[data-tab="reports"]').addEventListener('click', () => {
      loadReportsData();
    });
  }
}

/**
 * 加载报告数据
 */
async function loadReportsData() {
  const submissionChartContainer = document.getElementById('submission-chart');
  const indexingChartContainer = document.getElementById('indexing-chart');
  const domainStatsContainer = document.getElementById('domain-stats');
  
  if (!submissionChartContainer || !indexingChartContainer || !domainStatsContainer) return;
  
  showLoading('加载报告数据...');
  
  try {
    // 获取提交统计数据
    const submissionStats = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'submission_stats',
        license_key: getLicenseKey()
      }
    });
    
    // 创建提交统计图表
    const submissionCtx = submissionChartContainer.getContext('2d');
    new Chart(submissionCtx, {
      type: 'bar',
      data: {
        labels: submissionStats.labels,
        datasets: [{
          label: 'URL提交数',
          data: submissionStats.data,
          backgroundColor: 'rgba(66, 133, 244, 0.7)',
          borderColor: 'rgba(66, 133, 244, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // 获取索引统计数据
    const indexingStats = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'indexing_stats',
        license_key: getLicenseKey()
      }
    });
    
    // 创建索引统计图表
    const indexingCtx = indexingChartContainer.getContext('2d');
    new Chart(indexingCtx, {
      type: 'line',
      data: {
        labels: indexingStats.labels,
        datasets: [{
          label: '索引率 (%)',
          data: indexingStats.data,
          backgroundColor: 'rgba(52, 168, 83, 0.2)',
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // 获取域名统计数据
    const domainStats = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'domain_stats',
        license_key: getLicenseKey()
      }
    });
    
    // 更新域名统计表格
    let domainStatsHtml = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>域名</th>
              <th>已提交URL</th>
              <th>已索引URL</th>
              <th>索引率</th>
              <th>平均索引时间</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    domainStats.forEach(domain => {
      domainStatsHtml += `
        <tr>
          <td>${domain.domain}</td>
          <td>${domain.submitted_count}</td>
          <td>${domain.indexed_count}</td>
          <td>${domain.index_rate}%</td>
          <td>${domain.avg_index_time}天</td>
        </tr>
      `;
    });
    
    domainStatsHtml += `
          </tbody>
        </table>
      </div>
    `;
    
    domainStatsContainer.innerHTML = domainStatsHtml;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(`加载报告数据失败: ${error.message}`, 'error');
  }
}

/**
 * 初始化定时任务功能
 */
function initScheduleTasks() {
  const scheduleTab = document.getElementById('schedule-tab');
  if (scheduleTab) {
    // 当切换到定时任务Tab时加载数据
    document.querySelector('a[data-tab="schedule"]').addEventListener('click', () => {
      loadScheduleTasks();
    });
    
    // 初始化创建定时任务表单
    const createTaskForm = document.getElementById('create-task-form');
    if (createTaskForm) {
      createTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskName = document.getElementById('task-name').value;
        const taskType = document.getElementById('task-type').value;
        const schedule = document.getElementById('task-schedule').value;
        const domain = document.getElementById('task-domain').value;
        
        if (!taskName || !taskType || !schedule) {
          showToast('请填写所有必填字段', 'error');
          return;
        }
        
        // 显示加载状态
        showLoading('正在创建定时任务...');
        
        try {
          // 调用API创建定时任务
          const result = await api.createCronJob({
            name: taskName,
            workflow: taskType,
            schedule: schedule,
            data: {
              domain: domain,
              license_key: getLicenseKey()
            }
          });
          
          hideLoading();
          showToast('定时任务创建成功', 'success');
          
          // 重新加载定时任务列表
          loadScheduleTasks();
          
          // 重置表单
          createTaskForm.reset();
        } catch (error) {
          hideLoading();
          showToast(`创建失败: ${error.message}`, 'error');
        }
      });
    }
  }
}

/**
 * 加载定时任务列表
 */
async function loadScheduleTasks() {
  const tasksContainer = document.getElementById('schedule-tasks');
  if (!tasksContainer) return;
  
  showLoading('加载定时任务...');
  
  try {
    // 调用API获取定时任务列表
    const cronJobs = await api.getCronJobs();
    
    // 格式化数据用于显示
    const formattedJobs = api.formatCronJobData(cronJobs);
    
    // 更新任务列表
    let tasksHtml = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>任务名称</th>
              <th>类型</th>
              <th>执行计划</th>
              <th>上次执行</th>
              <th>下次执行</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (formattedJobs.length === 0) {
      tasksHtml += `
        <tr>
          <td colspan="7" class="text-center">暂无定时任务</td>
        </tr>
      `;
    } else {
      formattedJobs.forEach(job => {
        tasksHtml += `
          <tr>
            <td>${job.name}</td>
            <td>${getWorkflowName(job.workflow)}</td>
            <td>${job.schedule}</td>
            <td>${job.lastRun}</td>
            <td>${job.nextRun}</td>
            <td><span class="badge ${job.status === 'active' ? 'success' : 'warning'}">${job.status === 'active' ? '活跃' : '暂停'}</span></td>
            <td>
              <button class="btn btn-sm btn-outline toggle-job" data-id="${job.id}" data-status="${job.status}">
                <i class="fas ${job.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-job" data-id="${job.id}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
    
    tasksHtml += `
          </tbody>
        </table>
      </div>
    `;
    
    tasksContainer.innerHTML = tasksHtml;
    
    // 添加任务操作事件
    document.querySelectorAll('.toggle-job').forEach(btn => {
      btn.addEventListener('click', async () => {
        const jobId = btn.getAttribute('data-id');
        const currentStatus = btn.getAttribute('data-status');
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        
        try {
          await api.updateCronJob({
            id: jobId,
            status: newStatus
          });
          
          showToast(`任务${newStatus === 'active' ? '已激活' : '已暂停'}`, 'success');
          loadScheduleTasks();
        } catch (error) {
          showToast(`操作失败: ${error.message}`, 'error');
        }
      });
    });
    
    document.querySelectorAll('.delete-job').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('确定要删除这个定时任务吗？')) {
          const jobId = btn.getAttribute('data-id');
          
          try {
            await api.deleteCronJob({
              id: jobId
            });
            
            showToast('任务已删除', 'success');
            loadScheduleTasks();
          } catch (error) {
            showToast(`删除失败: ${error.message}`, 'error');
          }
        }
      });
    });
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(`加载定时任务失败: ${error.message}`, 'error');
  }
}

/**
 * 加载概览数据
 */
async function loadOverviewData() {
  const overviewTab = document.getElementById('overview-tab');
  if (!overviewTab) return;
  
  try {
    // 获取工作状态
    const status = await api.getWorkerStatus();
    
    // 更新统计卡片
    const statCards = overviewTab.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
      // 域名数量
      statCards[0].querySelector('h3').textContent = status.domain_count || '0';
      
      // 已提交URL数量
      statCards[1].querySelector('h3').textContent = status.submitted_url_count || '0';
      
      // 已索引URL数量
      statCards[2].querySelector('h3').textContent = status.indexed_url_count || '0';
      
      // 活跃定时任务数量
      statCards[3].querySelector('h3').textContent = status.active_cron_jobs || '0';
    }
    
    // 获取最近活动
    const recentActivities = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'recent_activities',
        license_key: getLicenseKey()
      }
    });
    
    // 更新最近活动表格
    const activitiesTable = overviewTab.querySelector('.dashboard-section table tbody');
    if (activitiesTable) {
      activitiesTable.innerHTML = '';
      
      recentActivities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(activity.timestamp).toLocaleString()}</td>
          <td>${activity.type}</td>
          <td>${activity.details}</td>
          <td><span class="badge ${getStatusBadgeClass(activity.status)}">${activity.status}</span></td>
        `;
        activitiesTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('加载概览数据失败:', error);
  }
}

/**
 * 刷新最近提交列表
 */
async function refreshRecentSubmissions() {
  const recentSubmissionsTable = document.querySelector('#batch-tab .batch-section:last-child table tbody');
  if (!recentSubmissionsTable) return;
  
  try {
    // 获取最近提交
    const submissions = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'recent_submissions',
        license_key: getLicenseKey()
      }
    });
    
    // 格式化数据用于显示
    const formattedSubmissions = api.formatSubmissionData(submissions);
    
    // 更新表格
    recentSubmissionsTable.innerHTML = '';
    
    formattedSubmissions.forEach(submission => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${submission.date}</td>
        <td>${submission.type}</td>
        <td>${submission.count}</td>
        <td>${submission.success}</td>
        <td><span class="badge ${getStatusBadgeClass(submission.status)}">${submission.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline view-submission" data-id="${submission.id}">
            <i class="fas fa-eye"></i> 查看
          </button>
        </td>
      `;
      recentSubmissionsTable.appendChild(row);
    });
    
    // 添加查看提交详情事件
    document.querySelectorAll('.view-submission').forEach(btn => {
      btn.addEventListener('click', async () => {
        const submissionId = btn.getAttribute('data-id');
        viewSubmissionDetails(submissionId);
      });
    });
  } catch (error) {
    console.error('刷新最近提交列表失败:', error);
  }
}

/**
 * 查看提交详情
 * @param {string} submissionId - 提交ID
 */
async function viewSubmissionDetails(submissionId) {
  try {
    showLoading('加载提交详情...');
    
    // 获取提交详情
    const details = await api.triggerWorkflow({
      workflow: 'INDEX_CHECK',
      data: {
        type: 'submission_details',
        submission_id: submissionId,
        license_key: getLicenseKey()
      }
    });
    
    hideLoading();
    
    // 创建模态框显示详情
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>提交详情</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="submission-info">
            <p><strong>提