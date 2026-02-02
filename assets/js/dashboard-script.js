// Dashboard Data and Functionality
class DashboardManager {
    constructor() {
        this.initializeData();
        this.initializeEventListeners();
        this.renderDashboard();
    }

    initializeData() {
        // Data will be loaded from API
        this.data = {
            kpis: {
                totalOrders: 0,
                activeProjects: 0,
                totalVendors: 0,
                totalEmployees: 0,
                monthlyRevenue: 0
            }
        };
    }

    initializeEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sidebar.classList.toggle('show');
            mainContent.classList.toggle('expanded');
        });

        // Menu navigation
        const menuItems = document.querySelectorAll('.menu-item a');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = item.getAttribute('data-section');
                this.showSection(targetSection);
                
                // Load section-specific data
                if (targetSection === 'customers') {
                    loadCustomersSection();
                } else if (targetSection === 'vendors') {
                    loadVendorsSection();
                } else if (targetSection === 'employees') {
                    loadEmployeesSection();
                } else if (targetSection === 'projects') {
                    loadProjectsSection();
                } else if (targetSection === 'payments') {
                    loadPaymentsSection();
                } else if (targetSection === 'reports') {
                    loadReportsSection();
                } else if (targetSection === 'settings') {
                    loadSettingsSection();
                }
                
                // Update active menu item
                document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
                item.parentElement.classList.add('active');
            });
        });

        // Handle mobile responsiveness
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('show');
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    async renderDashboard() {
        try {
            const stats = await APIService.getOrderStats();
            this.renderKPIs(stats);
            
            const orders = await APIService.getOrders();
            this.renderWorkflowFromOrders(orders);
            this.renderOrdersTable(orders);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Show empty state
            this.renderKPIs();
            this.renderWorkflowFromOrders([]);
            this.renderOrdersTable([]);
        }
    }

    renderKPIs(stats = null) {
        if (stats) {
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('activeProjects').textContent = stats.activeProjects;
            document.getElementById('monthlyRevenue').textContent = `$${stats.monthlyRevenue.toLocaleString()}`;
        } else {
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('activeProjects').textContent = '0';
            document.getElementById('monthlyRevenue').textContent = '$0';
        }
        
        document.getElementById('totalVendors').textContent = '0';
        document.getElementById('totalEmployees').textContent = '0';
    }

    renderWorkflowFromOrders(orders) {
        const newRequests = orders.filter(o => o.status === 'new');
        const workOrders = orders.filter(o => o.status === 'in-progress');
        const completedWork = orders.filter(o => o.status === 'completed');
        const activeWork = orders.filter(o => ['in-progress', 'delayed'].includes(o.status));

        // Update counts
        document.getElementById('newRequests').textContent = newRequests.length;
        document.getElementById('workOrders').textContent = workOrders.length;
        document.getElementById('activeWork').textContent = activeWork.length;
        document.getElementById('completedWork').textContent = completedWork.length;

        // Update items
        document.getElementById('newRequestItems').innerHTML = 
            newRequests.slice(0, 3).map(order => 
                `<div class="stage-item">${order.orderId} - ${order.customer.name || order.customer}</div>`
            ).join('') || '<div class="stage-item">No new requests</div>';

        document.getElementById('workOrderItems').innerHTML = 
            workOrders.slice(0, 3).map(order => 
                `<div class="stage-item">${order.orderId} - ${order.customer.name || order.customer}</div>`
            ).join('') || '<div class="stage-item">No work orders</div>';

        document.getElementById('activeWorkItems').innerHTML = 
            activeWork.slice(0, 3).map(order => 
                `<div class="stage-item">${order.orderId} - ${order.customer.name || order.customer}</div>`
            ).join('') || '<div class="stage-item">No active work</div>';

        document.getElementById('completedWorkItems').innerHTML = 
            completedWork.slice(0, 3).map(order => 
                `<div class="stage-item">${order.orderId} - ${order.customer.name || order.customer}</div>`
            ).join('') || '<div class="stage-item">No completed work</div>';
    }



    renderOrdersTable(orders = null) {
        const tbody = document.getElementById('ordersTableBody');
        const ordersData = orders || this.data.orders;
        
        tbody.innerHTML = ordersData.map(order => `
            <tr>
                <td>${order.orderId || order.id}</td>
                <td>${order.customer?.name || order.customer}</td>
                <td>${order.customer?.email || ''}</td>
                <td>${order.service}</td>
                <td>${order.vendor?.name || 'N/A'}</td>
                <td><span class="status-badge ${order.status}">${this.formatStatus(order.status)}</span></td>
                <td>${order.startDate ? this.formatDate(order.startDate) : 'N/A'}</td>
                <td>${order.endDate ? this.formatDate(order.endDate) : 'N/A'}</td>
                <td>$${order.amount?.toLocaleString() || '0'}</td>
                <td>
                    <button class="btn-action" onclick="viewOrder('${order._id || order.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editOrder('${order._id || order.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteOrder('${order._id || order.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }



    formatStatus(status) {
        return status.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Action handlers
    viewOrder(orderId) {
        alert(`Viewing order: ${orderId}`);
    }

    editOrder(orderId) {
        alert(`Editing order: ${orderId}`);
    }

    // Simulate real-time updates
    startRealTimeUpdates() {
        setInterval(() => {
            // Simulate random updates to KPIs
            const randomChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            this.data.kpis.totalOrders += randomChange;
            
            // Update display
            document.getElementById('totalOrders').textContent = this.data.kpis.totalOrders;
        }, 30000); // Update every 30 seconds
    }
}

// Utility functions for additional interactivity
function addHoverEffects() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.kpi-card, .summary-card, .employee-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Simple search simulation
        if (searchTerm.length > 2) {
            console.log(`Searching for: ${searchTerm}`);
            // In a real application, this would filter data
        }
    });
}

// Notification handling
function initializeNotifications() {
    const notificationIcon = document.querySelector('.notification-icon');
    
    // Load unread count
    loadUnreadCount();
    
    // Set up click handler
    notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        showNotificationPanel();
    });
    
    // Refresh notifications every 30 seconds
    setInterval(loadUnreadCount, 30000);
}

async function loadUnreadCount() {
    try {
        const response = await window.APIService.getUnreadCount();
        const badge = document.querySelector('.notification-badge');
        if (response.count > 0) {
            badge.textContent = response.count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load notification count:', error);
    }
}

async function showNotificationPanel() {
    try {
        const notifications = await window.APIService.getNotifications();
        displayNotificationPanel(notifications);
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function displayNotificationPanel(notifications) {
    // Remove existing panel
    const existingPanel = document.getElementById('notificationPanel');
    if (existingPanel) existingPanel.remove();
    
    // Create notification panel
    const panel = document.createElement('div');
    panel.id = 'notificationPanel';
    panel.className = 'notification-panel';
    
    const header = `
        <div class="notification-header">
            <h3>Notifications</h3>
            <button onclick="markAllAsRead()" class="mark-all-read">Mark All Read</button>
            <button onclick="closeNotificationPanel()" class="close-panel">×</button>
        </div>
    `;
    
    const notificationList = notifications.length > 0 ? 
        notifications.map(notification => `
            <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" data-id="${notification._id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${formatTime(notification.createdAt)}</span>
                </div>
                ${!notification.isRead ? '<div class="unread-dot"></div>' : ''}
            </div>
        `).join('') : 
        '<div class="no-notifications">No notifications</div>';
    
    panel.innerHTML = header + '<div class="notification-list">' + notificationList + '</div>';
    
    // Add to page
    document.body.appendChild(panel);
    
    // Add click handlers for individual notifications
    panel.querySelectorAll('.notification-item.unread').forEach(item => {
        item.addEventListener('click', () => markNotificationAsRead(item.dataset.id));
    });
    
    // Close panel when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeNotificationPanel, { once: true });
    }, 100);
}

function getNotificationIcon(type) {
    const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle',
        order: 'clipboard-list',
        payment: 'credit-card',
        system: 'cog'
    };
    return icons[type] || 'bell';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

async function markNotificationAsRead(notificationId) {
    try {
        await window.APIService.markAsRead(notificationId);
        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
        }
        loadUnreadCount();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllAsRead() {
    try {
        await window.APIService.markAllAsRead();
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
        });
        loadUnreadCount();
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) panel.remove();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    const sessionData = SessionManager.checkAuthentication();
    if (!sessionData) return;
    
    // Update user info in dashboard
    updateUserInfo(sessionData);
    
    // Create global dashboard instance
    window.dashboard = new DashboardManager();
    
    // Initialize additional features
    addHoverEffects();
    initializeSearch();
    initializeNotifications();
    initializeLogout();
    
    // Start real-time updates
    dashboard.startRealTimeUpdates();
    
    // Apply saved theme on initialization
    applySavedTheme();
    
    console.log('Hutta Home Services Admin Dashboard initialized successfully!');
});

// Update user information in dashboard
function updateUserInfo(sessionData) {
    const adminName = document.getElementById('adminName');
    const adminAvatar = document.getElementById('adminAvatar');
    
    if (adminName && sessionData.user) {
        const user = sessionData.user;
        const displayName = user.firstName && user.lastName ? 
            `${user.firstName} ${user.lastName}` : 
            (user.firstName || user.email.split('@')[0]);
        
        adminName.textContent = displayName;
        
        // Update avatar
        if (user.avatar) {
            adminAvatar.src = user.avatar;
        } else {
            const firstLetter = (user.firstName || user.email).charAt(0).toUpperCase();
            adminAvatar.src = `https://via.placeholder.com/40x40/4CAF50/white?text=${firstLetter}`;
        }
        adminAvatar.alt = displayName;
    }
}

// Initialize logout functionality
function initializeLogout() {
    const adminProfile = document.getElementById('adminProfile');
    const profileDropdown = document.getElementById('profileDropdown');
    
    adminProfile.addEventListener('click', function(e) {
        e.stopPropagation();
        adminProfile.classList.toggle('active');
        profileDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        adminProfile.classList.remove('active');
        profileDropdown.classList.remove('show');
    });
}

// Order Management Functions
let currentOrderId = null;
let vendors = [];

async function loadVendors() {
    try {
        vendors = await window.APIService.getVendors();
        const vendorSelect = document.getElementById('vendor');
        vendorSelect.innerHTML = '<option value="">Select Vendor</option>' +
            vendors.map(vendor => `<option value="${vendor._id}">${vendor.name} (${vendor.category})</option>`).join('');
    } catch (error) {
        console.error('Failed to load vendors:', error);
    }
}

function showAddOrderModal() {
    currentOrderId = null;
    document.getElementById('orderModalTitle').textContent = 'Add New Order';
    document.getElementById('orderForm').reset();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    
    loadVendors();
    document.getElementById('orderModal').classList.add('show');
}

async function editOrder(orderId) {
    try {
        currentOrderId = orderId;
        const order = await window.APIService.getOrder(orderId);
        
        document.getElementById('orderModalTitle').textContent = 'Edit Order';
        
        // Populate form
        document.getElementById('customerName').value = order.customer.name || '';
        document.getElementById('customerEmail').value = order.customer.email || '';
        document.getElementById('customerPhone').value = order.customer.phone || '';
        document.getElementById('customerAddress').value = order.customer.address || '';
        document.getElementById('service').value = order.service || '';
        document.getElementById('amount').value = order.amount || '';
        document.getElementById('startDate').value = order.startDate ? order.startDate.split('T')[0] : '';
        document.getElementById('endDate').value = order.endDate ? order.endDate.split('T')[0] : '';
        document.getElementById('status').value = order.status || 'new';
        document.getElementById('priority').value = order.priority || 'medium';
        document.getElementById('description').value = order.description || '';
        document.getElementById('notes').value = order.notes || '';
        
        await loadVendors();
        if (order.vendor) {
            document.getElementById('vendor').value = order.vendor._id || order.vendor;
        }
        
        document.getElementById('orderModal').classList.add('show');
    } catch (error) {
        alert('Failed to load order: ' + error.message);
    }
}

async function saveOrder() {
    const form = document.getElementById('orderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const orderData = {
        customer: {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value
        },
        service: document.getElementById('service').value,
        amount: parseFloat(document.getElementById('amount').value),
        vendor: document.getElementById('vendor').value || null,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        description: document.getElementById('description').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        if (currentOrderId) {
            await window.APIService.updateOrder(currentOrderId, orderData);
            alert('Order updated successfully!');
        } else {
            await window.APIService.createOrder(orderData);
            alert('Order created successfully!');
        }
        
        closeOrderModal();
        await refreshOrders();
    } catch (error) {
        alert('Failed to save order: ' + error.message);
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }
    
    try {
        await window.APIService.deleteOrder(orderId);
        alert('Order deleted successfully!');
        await refreshOrders();
    } catch (error) {
        alert('Failed to delete order: ' + error.message);
    }
}

function viewOrder(orderId) {
    editOrder(orderId);
    // Make form read-only
    const inputs = document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('orderModalTitle').textContent = 'View Order';
    document.querySelector('.modal-footer .btn-primary').style.display = 'none';
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('.modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshOrders() {
    try {
        const orders = await window.APIService.getOrders();
        window.dashboard.renderOrdersTable(orders);
    } catch (error) {
        console.error('Failed to refresh orders:', error);
    }
}

// Settings Management Functions
let currentSettings = null;

async function loadSettings() {
    try {
        currentSettings = await window.APIService.getSettings();
        populateSettingsForm(currentSettings);
    } catch (error) {
        console.error('Failed to load settings:', error);
        // Create default settings object
        currentSettings = {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            notifications: {
                email: true,
                push: true,
                sms: false
            },
            dashboard: {
                itemsPerPage: 10,
                defaultView: 'table',
                autoRefresh: true,
                refreshInterval: 30
            },
            company: {
                name: '',
                address: '',
                phone: '',
                email: '',
                website: ''
            }
        };
        populateSettingsForm(currentSettings);
    }
}

function populateSettingsForm(settings) {
    // User Preferences
    document.getElementById('settingsTheme').value = settings.theme || 'light';
    document.getElementById('settingsLanguage').value = settings.language || 'en';
    document.getElementById('settingsTimezone').value = settings.timezone || 'UTC';
    
    // Notifications
    document.getElementById('notificationsEmail').checked = settings.notifications?.email ?? true;
    document.getElementById('notificationsPush').checked = settings.notifications?.push ?? true;
    document.getElementById('notificationsSms').checked = settings.notifications?.sms ?? false;
    
    // Dashboard
    document.getElementById('dashboardItemsPerPage').value = settings.dashboard?.itemsPerPage || 10;
    document.getElementById('dashboardDefaultView').value = settings.dashboard?.defaultView || 'table';
    document.getElementById('dashboardAutoRefresh').checked = settings.dashboard?.autoRefresh ?? true;
    document.getElementById('dashboardRefreshInterval').value = settings.dashboard?.refreshInterval || 30;
    
    // Company
    document.getElementById('companyName').value = settings.company?.name || '';
    document.getElementById('companyAddress').value = settings.company?.address || '';
    document.getElementById('companyPhone').value = settings.company?.phone || '';
    document.getElementById('companyEmail').value = settings.company?.email || '';
    document.getElementById('companyWebsite').value = settings.company?.website || '';
    
    // Apply theme
    applyTheme(settings.theme || 'light');
}

async function saveSettings() {
    const settingsData = {
        theme: document.getElementById('settingsTheme').value,
        language: document.getElementById('settingsLanguage').value,
        timezone: document.getElementById('settingsTimezone').value,
        notifications: {
            email: document.getElementById('notificationsEmail').checked,
            push: document.getElementById('notificationsPush').checked,
            sms: document.getElementById('notificationsSms').checked
        },
        dashboard: {
            itemsPerPage: parseInt(document.getElementById('dashboardItemsPerPage').value),
            defaultView: document.getElementById('dashboardDefaultView').value,
            autoRefresh: document.getElementById('dashboardAutoRefresh').checked,
            refreshInterval: parseInt(document.getElementById('dashboardRefreshInterval').value)
        },
        company: {
            name: document.getElementById('companyName').value,
            address: document.getElementById('companyAddress').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            website: document.getElementById('companyWebsite').value
        }
    };
    
    try {
        await window.APIService.updateSettings(settingsData);
        currentSettings = { ...currentSettings, ...settingsData };
        
        // Apply theme immediately
        applyTheme(settingsData.theme);
        
        alert('Settings saved successfully!');
    } catch (error) {
        alert('Failed to save settings: ' + error.message);
    }
}

async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to default?')) {
        return;
    }
    
    try {
        const defaultSettings = await window.APIService.resetSettings();
        currentSettings = defaultSettings;
        populateSettingsForm(defaultSettings);
        alert('Settings reset to default successfully!');
    } catch (error) {
        alert('Failed to reset settings: ' + error.message);
    }
}

function applyTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    
    // Store theme preference in localStorage for immediate application
    localStorage.setItem('theme', theme);
}

// Load settings when settings section is shown
function loadSettingsSection() {
    loadSettings();
}

// Apply saved theme on page load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
}

// Global functions
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;

// Reports Management Functions
async function generateReports() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    try {
        // Load all reports
        const [financial, orders, customers, projects] = await Promise.all([
            window.APIService.getFinancialReport(startDate, endDate),
            window.APIService.getOrdersReport(startDate, endDate),
            window.APIService.getCustomersReport(),
            window.APIService.getProjectsReport()
        ]);
        
        // Render financial report
        renderFinancialReport(financial);
        
        // Render orders report
        renderOrdersReport(orders);
        
        // Render customers report
        renderCustomersReport(customers);
        
        // Render projects report
        renderProjectsReport(projects);
        
    } catch (error) {
        console.error('Failed to generate reports:', error);
        alert('Failed to generate reports: ' + error.message);
    }
}

function renderFinancialReport(data) {
    document.getElementById('reportTotalRevenue').textContent = `$${data.totalRevenue.toLocaleString()}`;
    document.getElementById('reportTotalPayments').textContent = `$${data.totalPayments.toLocaleString()}`;
    document.getElementById('reportPendingPayments').textContent = `$${data.pendingPayments.toLocaleString()}`;
    document.getElementById('reportCompletedOrders').textContent = data.completedOrders.toLocaleString();
}

function renderOrdersReport(data) {
    // Render orders status chart
    const statusChart = document.getElementById('ordersStatusChart');
    statusChart.innerHTML = data.statusBreakdown.map(item => `
        <div class="chart-item">
            <div class="chart-bar" style="width: ${(item.count / Math.max(...data.statusBreakdown.map(s => s.count))) * 100}%"></div>
            <span class="chart-label">${item._id}: ${item.count}</span>
        </div>
    `).join('');
    
    // Render monthly orders chart
    const monthlyChart = document.getElementById('monthlyOrdersChart');
    monthlyChart.innerHTML = data.monthlyOrders.map(item => `
        <div class="chart-item">
            <div class="chart-bar" style="width: ${(item.count / Math.max(...data.monthlyOrders.map(m => m.count))) * 100}%"></div>
            <span class="chart-label">${item._id}: ${item.count} orders ($${item.revenue.toLocaleString()})</span>
        </div>
    `).join('');
}

function renderCustomersReport(data) {
    // Render customer types chart
    const typesChart = document.getElementById('customerTypesChart');
    typesChart.innerHTML = data.customerTypes.map(item => `
        <div class="chart-item">
            <div class="chart-bar" style="width: ${(item.count / Math.max(...data.customerTypes.map(t => t.count))) * 100}%"></div>
            <span class="chart-label">${item._id}: ${item.count}</span>
        </div>
    `).join('');
    
    // Render top customers list
    const topList = document.getElementById('topCustomersList');
    topList.innerHTML = data.topCustomers.map((customer, index) => `
        <div class="top-item">
            <span class="rank">#${index + 1}</span>
            <div class="customer-info">
                <strong>${customer.name}</strong>
                <small>${customer.email}</small>
            </div>
            <div class="customer-stats">
                <span>$${customer.totalSpent.toLocaleString()}</span>
                <small>${customer.totalOrders} orders</small>
            </div>
        </div>
    `).join('');
}

function renderProjectsReport(data) {
    // Render project status chart
    const statusChart = document.getElementById('projectStatusChart');
    statusChart.innerHTML = data.statusBreakdown.map(item => `
        <div class="chart-item">
            <div class="chart-bar" style="width: ${(item.count / Math.max(...data.statusBreakdown.map(s => s.count))) * 100}%"></div>
            <span class="chart-label">${item._id}: ${item.count}</span>
        </div>
    `).join('');
    
    // Render budget analysis
    document.getElementById('totalBudget').textContent = `$${data.budgetAnalysis.totalBudget.toLocaleString()}`;
    document.getElementById('totalActualCost').textContent = `$${data.budgetAnalysis.totalActualCost.toLocaleString()}`;
    document.getElementById('avgProgress').textContent = `${Math.round(data.budgetAnalysis.avgProgress)}%`;
}

// Load reports when reports section is shown
function loadReportsSection() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
    
    generateReports();
}

// Global functions
window.generateReports = generateReports;

// Payment Management Functions
let currentPaymentId = null;
let paymentCustomers = [];
let paymentOrders = [];
let paymentProjects = [];

async function loadPaymentData() {
    try {
        [paymentCustomers, paymentOrders, paymentProjects] = await Promise.all([
            window.APIService.getCustomers(),
            window.APIService.getOrders(),
            window.APIService.getProjects()
        ]);
        
        // Populate customer dropdown
        const customerSelect = document.getElementById('paymentCustomer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' +
            paymentCustomers.map(customer => `<option value="${customer._id}">${customer.name}</option>`).join('');
        
        // Populate order dropdown
        const orderSelect = document.getElementById('paymentOrder');
        orderSelect.innerHTML = '<option value="">Select Order (Optional)</option>' +
            paymentOrders.map(order => `<option value="${order._id}">${order.orderId} - ${order.service}</option>`).join('');
        
        // Populate project dropdown
        const projectSelect = document.getElementById('paymentProject');
        projectSelect.innerHTML = '<option value="">Select Project (Optional)</option>' +
            paymentProjects.map(project => `<option value="${project._id}">${project.projectId} - ${project.name}</option>`).join('');
    } catch (error) {
        console.error('Failed to load payment data:', error);
    }
}

function showAddPaymentModal() {
    currentPaymentId = null;
    document.getElementById('paymentModalTitle').textContent = 'Record New Payment';
    document.getElementById('paymentForm').reset();
    
    // Set default payment date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;
    
    loadPaymentData();
    document.getElementById('paymentModal').classList.add('show');
}

async function editPayment(paymentId) {
    try {
        currentPaymentId = paymentId;
        const payment = await window.APIService.getPayment(paymentId);
        
        document.getElementById('paymentModalTitle').textContent = 'Edit Payment';
        
        // Load data first
        await loadPaymentData();
        
        // Populate form
        document.getElementById('paymentCustomer').value = payment.customer?._id || '';
        document.getElementById('paymentAmount').value = payment.amount || '';
        document.getElementById('paymentMethod').value = payment.paymentMethod || '';
        document.getElementById('paymentStatus').value = payment.status || 'pending';
        document.getElementById('paymentOrder').value = payment.order?._id || '';
        document.getElementById('paymentProject').value = payment.project?._id || '';
        document.getElementById('paymentDate').value = payment.paymentDate ? payment.paymentDate.split('T')[0] : '';
        document.getElementById('paymentDueDate').value = payment.dueDate ? payment.dueDate.split('T')[0] : '';
        document.getElementById('paymentTransactionId').value = payment.transactionId || '';
        document.getElementById('paymentReceiptNumber').value = payment.receiptNumber || '';
        document.getElementById('paymentDescription').value = payment.description || '';
        document.getElementById('paymentNotes').value = payment.notes || '';
        
        document.getElementById('paymentModal').classList.add('show');
    } catch (error) {
        alert('Failed to load payment: ' + error.message);
    }
}

async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const paymentData = {
        customer: document.getElementById('paymentCustomer').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        status: document.getElementById('paymentStatus').value,
        order: document.getElementById('paymentOrder').value || null,
        project: document.getElementById('paymentProject').value || null,
        paymentDate: document.getElementById('paymentDate').value,
        dueDate: document.getElementById('paymentDueDate').value || null,
        transactionId: document.getElementById('paymentTransactionId').value,
        receiptNumber: document.getElementById('paymentReceiptNumber').value,
        description: document.getElementById('paymentDescription').value,
        notes: document.getElementById('paymentNotes').value
    };
    
    try {
        if (currentPaymentId) {
            await window.APIService.updatePayment(currentPaymentId, paymentData);
            alert('Payment updated successfully!');
        } else {
            await window.APIService.createPayment(paymentData);
            alert('Payment recorded successfully!');
        }
        
        closePaymentModal();
        await refreshPayments();
    } catch (error) {
        alert('Failed to save payment: ' + error.message);
    }
}

async function deletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) {
        return;
    }
    
    try {
        await window.APIService.deletePayment(paymentId);
        alert('Payment deleted successfully!');
        await refreshPayments();
    } catch (error) {
        alert('Failed to delete payment: ' + error.message);
    }
}

function viewPayment(paymentId) {
    editPayment(paymentId);
    // Make form read-only
    const inputs = document.querySelectorAll('#paymentForm input, #paymentForm select, #paymentForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('paymentModalTitle').textContent = 'View Payment';
    document.querySelector('#paymentModal .modal-footer .btn-primary').style.display = 'none';
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#paymentForm input, #paymentForm select, #paymentForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('#paymentModal .modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshPayments() {
    try {
        const payments = await window.APIService.getPayments();
        renderPaymentsTable(payments);
    } catch (error) {
        console.error('Failed to refresh payments:', error);
    }
}

function renderPaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${payment.paymentId}</td>
            <td>${payment.customer?.name || 'N/A'}</td>
            <td>$${payment.amount.toLocaleString()}</td>
            <td><span class="method-badge ${payment.paymentMethod}">${payment.paymentMethod.replace('-', ' ')}</span></td>
            <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
            <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                ${payment.order ? `Order: ${payment.order.orderId}` : ''}
                ${payment.project ? `Project: ${payment.project.projectId}` : ''}
                ${!payment.order && !payment.project ? 'N/A' : ''}
            </td>
            <td>
                <button class="btn-action" onclick="viewPayment('${payment._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editPayment('${payment._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deletePayment('${payment._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load payments when payments section is shown
function loadPaymentsSection() {
    refreshPayments();
}

// Global functions for button clicks
window.viewPayment = viewPayment;
window.editPayment = editPayment;
window.deletePayment = deletePayment;
window.showAddPaymentModal = showAddPaymentModal;
window.closePaymentModal = closePaymentModal;
window.savePayment = savePayment;

// Project Management Functions
let currentProjectId = null;
let projectCustomers = [];
let projectVendors = [];
let projectEmployees = [];

async function loadProjectData() {
    try {
        [projectCustomers, projectVendors, projectEmployees] = await Promise.all([
            window.APIService.getCustomers(),
            window.APIService.getVendors(),
            window.APIService.getEmployees()
        ]);
        
        // Populate customer dropdown
        const customerSelect = document.getElementById('projectCustomer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' +
            projectCustomers.map(customer => `<option value="${customer._id}">${customer.name}</option>`).join('');
        
        // Populate vendor dropdown
        const vendorSelect = document.getElementById('projectVendor');
        vendorSelect.innerHTML = '<option value="">Select Vendor</option>' +
            projectVendors.map(vendor => `<option value="${vendor._id}">${vendor.name} (${vendor.category})</option>`).join('');
        
        // Populate employees dropdown
        const employeeSelect = document.getElementById('projectEmployees');
        employeeSelect.innerHTML = projectEmployees.map(employee => 
            `<option value="${employee._id}">${employee.name} - ${employee.role}</option>`
        ).join('');
    } catch (error) {
        console.error('Failed to load project data:', error);
    }
}

function showAddProjectModal() {
    currentProjectId = null;
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('projectStartDate').value = today;
    
    loadProjectData();
    document.getElementById('projectModal').classList.add('show');
}

async function editProject(projectId) {
    try {
        currentProjectId = projectId;
        const project = await window.APIService.getProject(projectId);
        
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        
        // Load data first
        await loadProjectData();
        
        // Populate form
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectCustomer').value = project.customer?._id || '';
        document.getElementById('projectVendor').value = project.vendor?._id || '';
        document.getElementById('projectBudget').value = project.budget || '';
        document.getElementById('projectStartDate').value = project.startDate ? project.startDate.split('T')[0] : '';
        document.getElementById('projectEndDate').value = project.endDate ? project.endDate.split('T')[0] : '';
        document.getElementById('projectStatus').value = project.status || 'planning';
        document.getElementById('projectPriority').value = project.priority || 'medium';
        document.getElementById('projectProgress').value = project.progress || 0;
        document.getElementById('projectLocation').value = project.location || '';
        document.getElementById('projectNotes').value = project.notes || '';
        
        // Select assigned employees
        const employeeSelect = document.getElementById('projectEmployees');
        const assignedIds = project.assignedEmployees?.map(emp => emp._id) || [];
        Array.from(employeeSelect.options).forEach(option => {
            option.selected = assignedIds.includes(option.value);
        });
        
        document.getElementById('projectModal').classList.add('show');
    } catch (error) {
        alert('Failed to load project: ' + error.message);
    }
}

async function saveProject() {
    const form = document.getElementById('projectForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const employeeSelect = document.getElementById('projectEmployees');
    const selectedEmployees = Array.from(employeeSelect.selectedOptions).map(option => option.value);
    
    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        customer: document.getElementById('projectCustomer').value,
        vendor: document.getElementById('projectVendor').value || null,
        budget: parseFloat(document.getElementById('projectBudget').value),
        startDate: document.getElementById('projectStartDate').value,
        endDate: document.getElementById('projectEndDate').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        progress: parseInt(document.getElementById('projectProgress').value) || 0,
        location: document.getElementById('projectLocation').value,
        assignedEmployees: selectedEmployees,
        notes: document.getElementById('projectNotes').value
    };
    
    try {
        if (currentProjectId) {
            await window.APIService.updateProject(currentProjectId, projectData);
            alert('Project updated successfully!');
        } else {
            await window.APIService.createProject(projectData);
            alert('Project created successfully!');
        }
        
        closeProjectModal();
        await refreshProjects();
    } catch (error) {
        alert('Failed to save project: ' + error.message);
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    
    try {
        await window.APIService.deleteProject(projectId);
        alert('Project deleted successfully!');
        await refreshProjects();
    } catch (error) {
        alert('Failed to delete project: ' + error.message);
    }
}

function viewProject(projectId) {
    editProject(projectId);
    // Make form read-only
    const inputs = document.querySelectorAll('#projectForm input, #projectForm select, #projectForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('projectModalTitle').textContent = 'View Project';
    document.querySelector('#projectModal .modal-footer .btn-primary').style.display = 'none';
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#projectForm input, #projectForm select, #projectForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('#projectModal .modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshProjects() {
    try {
        const projects = await window.APIService.getProjects();
        renderProjectsTable(projects);
    } catch (error) {
        console.error('Failed to refresh projects:', error);
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projectsTableBody');
    
    tbody.innerHTML = projects.map(project => `
        <tr>
            <td>${project.projectId}</td>
            <td>${project.name}</td>
            <td>${project.customer?.name || 'N/A'}</td>
            <td><span class="status-badge ${project.status}">${project.status.replace('-', ' ')}</span></td>
            <td><span class="priority-badge ${project.priority}">${project.priority}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                    <span class="progress-text">${project.progress}%</span>
                </div>
            </td>
            <td>$${project.budget.toLocaleString()}</td>
            <td>${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</td>
            <td>${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn-action" onclick="viewProject('${project._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editProject('${project._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteProject('${project._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load projects when projects section is shown
function loadProjectsSection() {
    refreshProjects();
}

// Global functions for button clicks
window.viewProject = viewProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.showAddProjectModal = showAddProjectModal;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;

// Employee Management Functions
let currentEmployeeId = null;

function showAddEmployeeModal() {
    currentEmployeeId = null;
    document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
    document.getElementById('employeeForm').reset();
    
    // Set default hire date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('employeeHireDate').value = today;
    
    document.getElementById('employeeModal').classList.add('show');
}

async function editEmployee(employeeId) {
    try {
        currentEmployeeId = employeeId;
        const employee = await window.APIService.getEmployee(employeeId);
        
        document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
        
        // Populate form
        document.getElementById('employeeName').value = employee.name || '';
        document.getElementById('employeeEmail').value = employee.email || '';
        document.getElementById('employeePhone').value = employee.phone || '';
        document.getElementById('employeeAddress').value = employee.address || '';
        document.getElementById('employeeRole').value = employee.role || '';
        document.getElementById('employeeDepartment').value = employee.department || '';
        document.getElementById('employeeSalary').value = employee.salary || '';
        document.getElementById('employeeHireDate').value = employee.hireDate ? employee.hireDate.split('T')[0] : '';
        document.getElementById('employeeStatus').value = employee.status || 'available';
        document.getElementById('employeeSkills').value = employee.skills ? employee.skills.join(', ') : '';
        
        document.getElementById('employeeModal').classList.add('show');
    } catch (error) {
        alert('Failed to load employee: ' + error.message);
    }
}

async function saveEmployee() {
    const form = document.getElementById('employeeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const skillsText = document.getElementById('employeeSkills').value;
    const skills = skillsText ? skillsText.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
    
    const employeeData = {
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        phone: document.getElementById('employeePhone').value,
        address: document.getElementById('employeeAddress').value,
        role: document.getElementById('employeeRole').value,
        department: document.getElementById('employeeDepartment').value,
        salary: parseFloat(document.getElementById('employeeSalary').value) || 0,
        hireDate: document.getElementById('employeeHireDate').value,
        status: document.getElementById('employeeStatus').value,
        skills: skills
    };
    
    try {
        if (currentEmployeeId) {
            await window.APIService.updateEmployee(currentEmployeeId, employeeData);
            alert('Employee updated successfully!');
        } else {
            await window.APIService.createEmployee(employeeData);
            alert('Employee created successfully!');
        }
        
        closeEmployeeModal();
        await refreshEmployees();
    } catch (error) {
        alert('Failed to save employee: ' + error.message);
    }
}

async function deleteEmployee(employeeId) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }
    
    try {
        await window.APIService.deleteEmployee(employeeId);
        alert('Employee deleted successfully!');
        await refreshEmployees();
    } catch (error) {
        alert('Failed to delete employee: ' + error.message);
    }
}

function viewEmployee(employeeId) {
    editEmployee(employeeId);
    // Make form read-only
    const inputs = document.querySelectorAll('#employeeForm input, #employeeForm select, #employeeForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('employeeModalTitle').textContent = 'View Employee';
    document.querySelector('#employeeModal .modal-footer .btn-primary').style.display = 'none';
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#employeeForm input, #employeeForm select, #employeeForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('#employeeModal .modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshEmployees() {
    try {
        const employees = await window.APIService.getEmployees();
        renderEmployeesTable(employees);
    } catch (error) {
        console.error('Failed to refresh employees:', error);
    }
}

function renderEmployeesTable(employees) {
    const tbody = document.getElementById('employeesTableBody');
    
    tbody.innerHTML = employees.map(employee => `
        <tr>
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.phone || 'N/A'}</td>
            <td><span class="status-badge ${employee.role}">${employee.role.replace('-', ' ')}</span></td>
            <td>${employee.department || 'N/A'}</td>
            <td><span class="status-badge ${employee.status}">${employee.status.replace('-', ' ')}</span></td>
            <td>${employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn-action" onclick="viewEmployee('${employee._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editEmployee('${employee._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteEmployee('${employee._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load employees when employees section is shown
function loadEmployeesSection() {
    refreshEmployees();
}

// Global functions for button clicks
window.viewEmployee = viewEmployee;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.showAddEmployeeModal = showAddEmployeeModal;
window.closeEmployeeModal = closeEmployeeModal;
window.saveEmployee = saveEmployee;

// Vendor Management Functions
let currentVendorId = null;

function showAddVendorModal() {
    currentVendorId = null;
    document.getElementById('vendorModalTitle').textContent = 'Add New Vendor';
    document.getElementById('vendorForm').reset();
    document.getElementById('vendorModal').classList.add('show');
}

async function editVendor(vendorId) {
    try {
        currentVendorId = vendorId;
        const vendor = await window.APIService.getVendor(vendorId);
        
        document.getElementById('vendorModalTitle').textContent = 'Edit Vendor';
        
        // Populate form
        document.getElementById('vendorName').value = vendor.name || '';
        document.getElementById('vendorEmail').value = vendor.email || '';
        document.getElementById('vendorPhone').value = vendor.phone || '';
        document.getElementById('vendorAddress').value = vendor.address || '';
        document.getElementById('vendorCategory').value = vendor.category || '';
        document.getElementById('vendorRating').value = vendor.rating || 5;
        document.getElementById('vendorStatus').value = vendor.isActive.toString();
        
        document.getElementById('vendorModal').classList.add('show');
    } catch (error) {
        alert('Failed to load vendor: ' + error.message);
    }
}

async function saveVendor() {
    const form = document.getElementById('vendorForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const vendorData = {
        name: document.getElementById('vendorName').value,
        email: document.getElementById('vendorEmail').value,
        phone: document.getElementById('vendorPhone').value,
        address: document.getElementById('vendorAddress').value,
        category: document.getElementById('vendorCategory').value,
        rating: parseInt(document.getElementById('vendorRating').value),
        isActive: document.getElementById('vendorStatus').value === 'true'
    };
    
    try {
        if (currentVendorId) {
            await window.APIService.updateVendor(currentVendorId, vendorData);
            alert('Vendor updated successfully!');
        } else {
            await window.APIService.createVendor(vendorData);
            alert('Vendor created successfully!');
        }
        
        closeVendorModal();
        await refreshVendors();
    } catch (error) {
        alert('Failed to save vendor: ' + error.message);
    }
}

async function deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to delete this vendor?')) {
        return;
    }
    
    try {
        await window.APIService.deleteVendor(vendorId);
        alert('Vendor deleted successfully!');
        await refreshVendors();
    } catch (error) {
        alert('Failed to delete vendor: ' + error.message);
    }
}

function viewVendor(vendorId) {
    editVendor(vendorId);
    // Make form read-only
    const inputs = document.querySelectorAll('#vendorForm input, #vendorForm select, #vendorForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('vendorModalTitle').textContent = 'View Vendor';
    document.querySelector('#vendorModal .modal-footer .btn-primary').style.display = 'none';
}

function closeVendorModal() {
    document.getElementById('vendorModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#vendorForm input, #vendorForm select, #vendorForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('#vendorModal .modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshVendors() {
    try {
        const vendors = await window.APIService.getVendors();
        renderVendorsTable(vendors);
    } catch (error) {
        console.error('Failed to refresh vendors:', error);
    }
}

function renderVendorsTable(vendors) {
    const tbody = document.getElementById('vendorsTableBody');
    
    tbody.innerHTML = vendors.map(vendor => `
        <tr>
            <td>${vendor.name}</td>
            <td>${vendor.email}</td>
            <td>${vendor.phone || 'N/A'}</td>
            <td><span class="status-badge ${vendor.category}">${vendor.category}</span></td>
            <td>${'★'.repeat(vendor.rating)}${'☆'.repeat(5-vendor.rating)}</td>
            <td><span class="status-badge ${vendor.isActive ? 'active' : 'inactive'}">${vendor.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-action" onclick="viewVendor('${vendor._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editVendor('${vendor._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteVendor('${vendor._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load vendors when vendors section is shown
function loadVendorsSection() {
    refreshVendors();
}

// Global functions for button clicks
window.viewVendor = viewVendor;
window.editVendor = editVendor;
window.deleteVendor = deleteVendor;
window.showAddVendorModal = showAddVendorModal;
window.closeVendorModal = closeVendorModal;
window.saveVendor = saveVendor;

// Customer Management Functions
let currentCustomerId = null;

function showAddCustomerModal() {
    currentCustomerId = null;
    document.getElementById('customerModalTitle').textContent = 'Add New Customer';
    document.getElementById('customerForm').reset();
    document.getElementById('customerModal').classList.add('show');
}

async function editCustomer(customerId) {
    try {
        currentCustomerId = customerId;
        const customer = await window.APIService.getCustomer(customerId);
        
        document.getElementById('customerModalTitle').textContent = 'Edit Customer';
        
        // Populate form
        document.getElementById('customerNameField').value = customer.name || '';
        document.getElementById('customerEmailField').value = customer.email || '';
        document.getElementById('customerPhoneField').value = customer.phone || '';
        document.getElementById('customerAddressField').value = customer.address || '';
        document.getElementById('customerCity').value = customer.city || '';
        document.getElementById('customerState').value = customer.state || '';
        document.getElementById('customerZip').value = customer.zipCode || '';
        document.getElementById('customerType').value = customer.customerType || 'one-time';
        document.getElementById('customerStatus').value = customer.status || 'active';
        document.getElementById('customerNotes').value = customer.notes || '';
        
        document.getElementById('customerModal').classList.add('show');
    } catch (error) {
        alert('Failed to load customer: ' + error.message);
    }
}

async function saveCustomer() {
    const form = document.getElementById('customerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const customerData = {
        name: document.getElementById('customerNameField').value,
        email: document.getElementById('customerEmailField').value,
        phone: document.getElementById('customerPhoneField').value,
        address: document.getElementById('customerAddressField').value,
        city: document.getElementById('customerCity').value,
        state: document.getElementById('customerState').value,
        zipCode: document.getElementById('customerZip').value,
        customerType: document.getElementById('customerType').value,
        status: document.getElementById('customerStatus').value,
        notes: document.getElementById('customerNotes').value
    };
    
    try {
        if (currentCustomerId) {
            await window.APIService.updateCustomer(currentCustomerId, customerData);
            alert('Customer updated successfully!');
        } else {
            await window.APIService.createCustomer(customerData);
            alert('Customer created successfully!');
        }
        
        closeCustomerModal();
        await refreshCustomers();
    } catch (error) {
        alert('Failed to save customer: ' + error.message);
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }
    
    try {
        await window.APIService.deleteCustomer(customerId);
        alert('Customer deleted successfully!');
        await refreshCustomers();
    } catch (error) {
        alert('Failed to delete customer: ' + error.message);
    }
}

function viewCustomer(customerId) {
    editCustomer(customerId);
    // Make form read-only
    const inputs = document.querySelectorAll('#customerForm input, #customerForm select, #customerForm textarea');
    inputs.forEach(input => input.disabled = true);
    
    document.getElementById('customerModalTitle').textContent = 'View Customer';
    document.querySelector('#customerModal .modal-footer .btn-primary').style.display = 'none';
}

function closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('show');
    
    // Re-enable form inputs
    const inputs = document.querySelectorAll('#customerForm input, #customerForm select, #customerForm textarea');
    inputs.forEach(input => input.disabled = false);
    
    document.querySelector('#customerModal .modal-footer .btn-primary').style.display = 'inline-block';
}

async function refreshCustomers() {
    try {
        const customers = await window.APIService.getCustomers();
        renderCustomersTable(customers);
    } catch (error) {
        console.error('Failed to refresh customers:', error);
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.city || 'N/A'}</td>
            <td><span class="status-badge ${customer.customerType}">${customer.customerType}</span></td>
            <td><span class="status-badge ${customer.status}">${customer.status}</span></td>
            <td>${customer.totalOrders}</td>
            <td>$${customer.totalSpent.toLocaleString()}</td>
            <td>
                <button class="btn-action" onclick="viewCustomer('${customer._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="editCustomer('${customer._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteCustomer('${customer._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load customers when customers section is shown
function loadCustomersSection() {
    refreshCustomers();
}

// Global functions for button clicks
window.viewCustomer = viewCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.showAddCustomerModal = showAddCustomerModal;
window.closeCustomerModal = closeCustomerModal;
window.saveCustomer = saveCustomer;

// Global functions for button clicks
window.viewOrder = viewOrder;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.showAddOrderModal = showAddOrderModal;
window.closeOrderModal = closeOrderModal;
window.saveOrder = saveOrder;

// Profile and settings functions
function showProfile() {
    const modal = document.getElementById('profileModal');
    const sessionData = SessionManager.getUserInfo();
    
    if (sessionData && sessionData.user) {
        const user = sessionData.user;
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('role').value = user.role || 'administrator';
        document.getElementById('department').value = user.department || '';
        
        // Set avatar
        const avatar = user.avatar || `https://via.placeholder.com/100x100/4CAF50/white?text=${(user.firstName || 'A').charAt(0)}`;
        document.getElementById('profileAvatar').src = avatar;
    }
    
    modal.classList.add('show');
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
}

function saveProfile() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('phone').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;
    const avatar = document.getElementById('profileAvatar').src;
    
    // Get current user info
    const sessionData = SessionManager.getUserInfo();
    if (!sessionData) {
        alert('Session expired. Please login again.');
        return;
    }
    
    // Update profile via API
    window.APIService.updateProfile({
        email,
        firstName,
        lastName,
        phone,
        department,
        avatar
    }).then(response => {
        // Update session data with new user info
        sessionData.user = {
            ...sessionData.user,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            phone: response.user.phone,
            department: response.user.department,
            avatar: response.user.avatar
        };
        
        // Save to storage
        const storage = localStorage.getItem('huttaSession') ? localStorage : sessionStorage;
        storage.setItem('huttaSession', JSON.stringify(sessionData));
        
        // Update UI
        updateUserInfo(sessionData);
        
        alert('Profile updated successfully!');
        closeProfileModal();
    }).catch(error => {
        console.error('Profile update error:', error);
        alert('Failed to update profile: ' + error.message);
    });
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function uploadAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result;
                document.getElementById('profileAvatar').src = base64;
                document.getElementById('adminAvatar').src = base64;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function showSettings() {
    const settingsLink = document.querySelector('[data-section="settings"]');
    if (settingsLink) {
        settingsLink.click();
    }
}

// Add CSS for action buttons
const additionalStyles = `
.btn-action {
    background: none;
    border: none;
    color: var(--medium-gray);
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    margin: 0 2px;
    transition: all 0.2s;
}

.btn-action:hover {
    background: var(--light-gray);
    color: var(--primary-blue);
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);