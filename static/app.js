document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentLeads = [];
  let currentDatabases = [];
  let selectedProvider = 'PostgreSQL';
  let activeTabMode = 'connection_string';
  let selectedDateRange = 'all';
  let activeDisplayedLeadId = null;

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const viewContents = document.querySelectorAll('.view-content');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const toastContainer = document.getElementById('toast-container');

  // Dashboard & Form Elements
  const leadForm = document.getElementById('lead-form');
  const createLeadBtn = document.getElementById('create-lead-btn');
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const dashboardLeadSelect = document.getElementById('dashboard-lead-select');
  const runSelectedLeadBtn = document.getElementById('run-selected-lead-btn');
  const dashboardOpenDbBtn = document.getElementById('dashboard-open-db-btn');
  const reviewDecisionBar = document.getElementById('review-decision-bar');
  const btnApproveLead = document.getElementById('btn-approve-lead');
  const btnRequestInfo = document.getElementById('btn-request-info');
  const btnDisqualifyLead = document.getElementById('btn-disqualify-lead');

  // Leads List & Filter Elements
  const leadsList = document.getElementById('leads-list');
  const searchInput = document.getElementById('leads-search-input');
  const statusFilter = document.getElementById('leads-status-filter');
  const refreshDataBtn = document.getElementById('refresh-data-btn');
  const clearDataBtn = document.getElementById('clear-data-btn');

  // Date Picker Elements
  const datePickerBtn = document.getElementById('date-picker-btn');
  const dateDropdownMenu = document.getElementById('date-dropdown-menu');
  const selectedDateText = document.getElementById('selected-date-text');

  // User Profile Dropdown
  const userProfileMenuBtn = document.getElementById('user-profile-menu-btn');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');

  // DB Modal Elements
  const dbModalOverlay = document.getElementById('db-modal-overlay');
  const closeDbModalBtn = document.getElementById('close-db-modal');
  const headerConnectDbBtn = document.getElementById('header-connect-db-btn');
  const openDbModalFromLeadsBtn = document.getElementById('open-db-modal-from-leads');
  const settingsAddDbBtn = document.getElementById('settings-add-db-btn');
  const menuConnectDb = document.getElementById('menu-connect-db');
  const testDbBtn = document.getElementById('test-db-btn');
  const saveDbBtn = document.getElementById('save-db-btn');
  const connectionStatusBox = document.getElementById('connection-status-box');

  // Result Modal Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const closeModalBtn = document.getElementById('close-modal');
  const modalCloseBottom = document.getElementById('modal-close-bottom');

  // Confirm Modal Elements
  const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
  const confirmModalMessage = document.getElementById('confirm-modal-message');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const confirmOkBtn = document.getElementById('confirm-ok-btn');
  let confirmCallback = null;

  // Theme Management Elements
  const headerThemeBtn = document.getElementById('header-theme-btn');
  const themeDropdownMenu = document.getElementById('theme-dropdown-menu');
  let currentThemeMode = localStorage.getItem('theme_mode') || 'system';

  // Initialize Application
  initApp();

  async function initApp() {
    setupThemeManagement();
    setupEventListeners();
    setupNavigation();
    setupProviderSelector();
    setupTabs();
    setupFileUpload();
    setupServicesModal();
    setupKpiCardClickHandlers();
    await loadInitialData();
  }

  async function loadInitialData() {
    await fetchLeads();
    await fetchConnectedDatabases();
    await fetchAndRenderServicesCatalog();
  }

  // Toast Helper
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Navigation Logic
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        switchView(targetView);
      });
    });

    document.querySelectorAll('[data-view]').forEach(el => {
      if (!el.classList.contains('nav-item')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = el.getAttribute('data-view');
          switchView(targetView);
          userDropdownMenu?.classList.remove('active');
        });
      }
    });
  }

  function switchView(viewName) {
    navItems.forEach(nav => {
      if (nav.getAttribute('data-view') === viewName) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    viewContents.forEach(view => {
      if (view.id === `view-${viewName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    const titles = {
      dashboard: { title: 'AI Sales Qualification Agent', sub: 'Qualify leads, match services, and generate personalized outreach.' },
      leads: { title: 'Leads Management', sub: 'View, filter, and run AI qualification workflows across all inbound prospects.' },
      'agent-runs': { title: 'Agent Execution Log', sub: 'Audit history of AI agent runs, intent classifications, and scores.' },
      services: { title: 'Services Catalog', sub: 'Approved service packages and intent classification rules.' },
      settings: { title: 'Settings & Integrations', sub: 'Manage multi-protocol databases, LLM engines, and preferences.' }
    };

    if (titles[viewName]) {
      pageTitle.textContent = titles[viewName].title;
      pageSubtitle.textContent = titles[viewName].sub;
    }

    if (viewName === 'agent-runs') {
      renderAgentRunsTable();
    } else if (viewName === 'settings') {
      renderConnectedDatabases();
    } else if (viewName === 'leads') {
      filterAndRenderLeads();
    } else if (viewName === 'services') {
      fetchAndRenderServicesCatalog();
    }
  }

  // KPI Card Interactive Click Handlers
  function setupKpiCardClickHandlers() {
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const label = card.querySelector('.kpi-label')?.textContent || '';
        if (label.includes('Total')) {
          statusFilter.value = 'all';
        } else if (label.includes('Qualified')) {
          statusFilter.value = 'Qualified';
        } else if (label.includes('Pending Review')) {
          statusFilter.value = 'Needs Review';
        }
        switchView('leads');
      });
    });
  }

  // Global Event Listeners
  function setupEventListeners() {
    // Lead Form Submit
    if (leadForm) {
      leadForm.addEventListener('submit', handleLeadFormSubmit);
    }

    // Dashboard Select Lead & Run Agent Button
    if (runSelectedLeadBtn) {
      runSelectedLeadBtn.addEventListener('click', handleRunSelectedDashboardLead);
    }

    // Decision Action Bar Buttons (Approve, Request Info, Disqualify)
    if (btnApproveLead) {
      btnApproveLead.addEventListener('click', () => handleUpdateLeadStatus('qualified', 'Qualified', 'Book a discovery call', 85));
    }
    if (btnRequestInfo) {
      btnRequestInfo.addEventListener('click', () => handleUpdateLeadStatus('needs_review', 'Needs Review', 'Follow-up email sent requesting missing qualification details'));
    }
    if (btnDisqualifyLead) {
      btnDisqualifyLead.addEventListener('click', () => handleUpdateLeadStatus('unqualified', 'Disqualified', 'Add to nurture sequence', 25));
    }

    // Dashboard Open DB Modal Button
    if (dashboardOpenDbBtn) {
      dashboardOpenDbBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dbModalOverlay?.classList.add('active');
        connectionStatusBox?.classList.add('hidden');
      });
    }

    // Copy Email Draft Button
    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', () => {
        const subject = document.getElementById('subject-text').textContent;
        const body = document.getElementById('email-body-display').innerText;
        const fullText = `Subject: ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullText).then(() => {
          showToast('Copied email subject & body to clipboard!');
        });
      });
    }

    // Modal Copy Buttons
    document.getElementById('modal-copy-subject')?.addEventListener('click', () => {
      const text = document.getElementById('modal-email-subject').textContent;
      navigator.clipboard.writeText(text).then(() => showToast('Copied Subject!'));
    });

    document.getElementById('modal-copy-body')?.addEventListener('click', () => {
      const text = document.getElementById('modal-email-body').textContent;
      navigator.clipboard.writeText(text).then(() => showToast('Copied Email Body!'));
    });

    document.getElementById('modal-copy-all')?.addEventListener('click', () => {
      const subj = document.getElementById('modal-email-subject').textContent;
      const body = document.getElementById('modal-email-body').textContent;
      navigator.clipboard.writeText(`${subj}\n\n${body}`).then(() => showToast('Copied Complete Outreach!'));
    });

    // Date Picker Dropdown
    if (datePickerBtn) {
      datePickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dateDropdownMenu.classList.toggle('active');
      });
    }

    document.querySelectorAll('#date-dropdown-menu .dropdown-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const range = btn.getAttribute('data-range');
        selectedDateRange = range;
        selectedDateText.textContent = btn.textContent;
        document.querySelectorAll('#date-dropdown-menu .dropdown-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dateDropdownMenu.classList.remove('active');
        updateDashboardKPIs(currentLeads);
      });
    });

    // User Profile Dropdown Menu
    if (userProfileMenuBtn) {
      userProfileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownMenu.classList.toggle('active');
      });
    }

    document.addEventListener('click', () => {
      dateDropdownMenu?.classList.remove('active');
      userDropdownMenu?.classList.remove('active');
      themeDropdownMenu?.classList.remove('active');
    });

    // Modal Overlay Backdrop Click Closers
    [dbModalOverlay, modalOverlay, confirmModalOverlay].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    });

    // Menu Clear Leads
    document.getElementById('menu-clear-leads')?.addEventListener('click', (e) => {
      e.preventDefault();
      promptClearData();
    });

    // DB Modal Openers
    [headerConnectDbBtn, openDbModalFromLeadsBtn, settingsAddDbBtn, menuConnectDb].forEach(btn => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        dbModalOverlay.classList.add('active');
        connectionStatusBox?.classList.add('hidden');
      });
    });

    // DB Modal Closers
    closeDbModalBtn?.addEventListener('click', () => dbModalOverlay.classList.remove('active'));

    // Modal Results Closers
    closeModalBtn?.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalCloseBottom?.addEventListener('click', () => modalOverlay.classList.remove('active'));

    // Confirm Modal Listeners
    document.getElementById('close-confirm-modal')?.addEventListener('click', () => confirmModalOverlay.classList.remove('active'));
    confirmCancelBtn?.addEventListener('click', () => confirmModalOverlay.classList.remove('active'));
    confirmOkBtn?.addEventListener('click', () => {
      confirmModalOverlay.classList.remove('active');
      if (confirmCallback) confirmCallback();
    });

    // Search & Filter
    searchInput?.addEventListener('input', filterAndRenderLeads);
    statusFilter?.addEventListener('change', filterAndRenderLeads);

    // Refresh & Clear Data
    refreshDataBtn?.addEventListener('click', async () => {
      refreshDataBtn.classList.add('loading');
      await fetchLeads();
      refreshDataBtn.classList.remove('loading');
      showToast('Leads refreshed successfully');
    });

    clearDataBtn?.addEventListener('click', promptClearData);

    // DB Test & Save Connection Listeners
    testDbBtn?.addEventListener('click', handleTestDatabaseConnection);
    saveDbBtn?.addEventListener('click', handleSaveDatabaseConnection);

    // LLM Settings Save Listener
    const saveLlmSettingsBtn = document.getElementById('save-llm-settings-btn');
    if (saveLlmSettingsBtn) {
      saveLlmSettingsBtn.addEventListener('click', () => {
        const model = document.getElementById('settings-model-select').value;
        const apiKey = document.getElementById('settings-api-key').value;
        localStorage.setItem('llm_model', model);
        localStorage.setItem('llm_api_key', apiKey);
        showToast('AI Agent & LLM Configuration saved successfully!');
      });
    }
  }

  // Decision Handler: Update lead qualification status
  async function handleUpdateLeadStatus(qualification, statusText, actionText, scoreOverride = null) {
    if (!activeDisplayedLeadId) {
      showToast('No active lead selected for decision', 'error');
      return;
    }

    try {
      const payload = {
        qualification: qualification,
        status: statusText,
        recommended_action: actionText
      };
      if (scoreOverride !== null) payload.lead_score = scoreOverride;

      const res = await fetch(`/api/leads/${activeDisplayedLeadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedLead = await res.json();
        
        // Mutate lead in local memory immediately
        const idx = currentLeads.findIndex(l => String(l.id) === String(activeDisplayedLeadId));
        if (idx !== -1) {
          currentLeads[idx] = { ...currentLeads[idx], ...updatedLead };
        }

        updateDashboardResultDisplay({
          lead_score: updatedLead.lead_score,
          qualification: updatedLead.qualification,
          detected_intent: updatedLead.detected_intent,
          matched_service: 'AI Sales Qualification Agent',
          recommended_action: updatedLead.recommended_action,
          email_subject: updatedLead.email_subject,
          email_draft: updatedLead.email_draft
        }, updatedLead);

        updateDashboardKPIs(currentLeads);
        populateDashboardLeadSelect(currentLeads);
        filterAndRenderLeads();
        renderAgentRunsTable();

        showToast(`Updated "${updatedLead.name}" to ${statusText}!`);
        await fetchLeads();
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast('Error updating lead status', 'error');
    }
  }

  // Handle Lead Form Submission
  async function handleLeadFormSubmit(e) {
    e.preventDefault();
    
    createLeadBtn.disabled = true;
    createLeadBtn.innerHTML = `<i class="ph ph-spinner spinner"></i> Processing...`;

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      company: document.getElementById('company').value,
      industry: document.getElementById('industry').value || 'Technology',
      company_size: parseInt(document.getElementById('company_size').value || '10'),
      budget: parseFloat(document.getElementById('budget').value || '15000'),
      timeline: document.getElementById('timeline').value || '1-3 months',
      problem: document.getElementById('problem').value,
      source: document.getElementById('source').value || 'Website'
    };

    try {
      // Step 1: Create Lead
      const createRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!createRes.ok) throw new Error('Failed to create lead');
      const newLead = await createRes.json();

      currentLeads.unshift(newLead);
      updateDashboardKPIs(currentLeads);
      populateDashboardLeadSelect(currentLeads);
      filterAndRenderLeads();

      // Step 2: Run AI Agent Processing
      const agentRes = await fetch(`/api/agent/process/${newLead.id}`, { method: 'POST' });
      if (agentRes.ok) {
        const agentResult = await agentRes.json();
        
        const idx = currentLeads.findIndex(l => String(l.id) === String(newLead.id));
        if (idx !== -1) {
          currentLeads[idx] = { ...currentLeads[idx], ...agentResult };
        }

        activeDisplayedLeadId = newLead.id;
        updateDashboardResultDisplay(agentResult, formData);
        updateDashboardKPIs(currentLeads);
        populateDashboardLeadSelect(currentLeads);
        filterAndRenderLeads();
        renderAgentRunsTable();
        showToast(`Lead created & processed (Qualification: ${agentResult.qualification})!`);
      } else {
        showToast('Lead created, but agent auto-process failed.', 'error');
      }

      leadForm.reset();
      await fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      createLeadBtn.disabled = false;
      createLeadBtn.innerHTML = `<i class="ph ph-sparkle"></i> <span>Create &amp; Process Lead</span>`;
    }
  }

  // Run AI Agent for Selected Dashboard Lead
  async function handleRunSelectedDashboardLead() {
    if (!dashboardLeadSelect) return;
    const leadId = dashboardLeadSelect.value;
    if (!leadId) {
      showToast('Please select a lead first', 'error');
      return;
    }

    runSelectedLeadBtn.disabled = true;
    runSelectedLeadBtn.innerHTML = `<i class="ph ph-spinner spinner"></i> Running...`;

    try {
      const res = await fetch(`/api/agent/process/${leadId}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        
        const idx = currentLeads.findIndex(l => String(l.id) === String(leadId));
        if (idx !== -1) {
          currentLeads[idx] = { ...currentLeads[idx], ...result };
        }

        activeDisplayedLeadId = leadId;
        const leadObj = currentLeads.find(l => String(l.id) === String(leadId)) || {};
        updateDashboardResultDisplay(result, leadObj);
        updateDashboardKPIs(currentLeads);
        populateDashboardLeadSelect(currentLeads);
        filterAndRenderLeads();
        renderAgentRunsTable();

        showToast(`AI Agent processed ${leadObj.name || 'Lead'} (Score: ${result.lead_score})!`);
        await fetchLeads();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Agent processing failed', 'error');
      }
    } catch (err) {
      console.error('Run selected lead error:', err);
      showToast('Error running agent on selected lead', 'error');
    } finally {
      runSelectedLeadBtn.disabled = false;
      runSelectedLeadBtn.innerHTML = `<i class="ph ph-play"></i> Run Agent`;
    }
  }

  // Populate Dashboard Lead Dropdown
  function populateDashboardLeadSelect(leads) {
    if (!dashboardLeadSelect) return;
    const previousValue = dashboardLeadSelect.value;
    dashboardLeadSelect.innerHTML = '';

    if (!leads || leads.length === 0) {
      dashboardLeadSelect.innerHTML = `<option value="">No leads available (Connect DB or Create Lead)</option>`;
      return;
    }

    leads.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      const scoreTag = (l.lead_score !== null && l.lead_score !== undefined) ? ` - Score: ${l.lead_score}` : ' - New';
      const qualTag = l.qualification ? ` [${l.qualification.replace(/_/g, ' ')}]` : '';
      opt.textContent = `${l.name} (${l.company}) [Source: ${l.source || 'DB'}]${qualTag}${scoreTag}`;
      dashboardLeadSelect.appendChild(opt);
    });

    if (previousValue && Array.from(dashboardLeadSelect.options).some(o => o.value === previousValue)) {
      dashboardLeadSelect.value = previousValue;
    }
  }

  // Helper for Badge CSS Class
  function getBadgeClass(qualification, status) {
    const q = String(qualification || '').toLowerCase();
    const s = String(status || '').toLowerCase();
    if (q === 'qualified' || s === 'qualified') return 'badge badge-success';
    if (q.includes('needs') || q.includes('review') || s.includes('needs') || s.includes('review')) return 'badge badge-warning';
    if (q.includes('unqualified') || q.includes('disqualified') || s.includes('unqualified')) return 'badge badge-danger';
    return 'badge badge-warning';
  }

  // Update Dashboard Agent Result Card
  function updateDashboardResultDisplay(result, leadData) {
    activeDisplayedLeadId = result.lead_id || leadData?.id || activeDisplayedLeadId;

    document.getElementById('display-lead-score').textContent = (result.lead_score !== null && result.lead_score !== undefined) ? result.lead_score : 'N/A';
    
    const qualSpan = document.getElementById('display-qualification');
    const qualText = (result.qualification || 'Qualified').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    qualSpan.textContent = qualText;
    qualSpan.className = getBadgeClass(result.qualification, result.status);

    document.getElementById('display-intent').textContent = (result.detected_intent || 'AI Sales Agent').replace(/_/g, ' ');
    document.getElementById('display-service').textContent = result.matched_service || 'AI Sales Qualification Agent';
    document.getElementById('display-action').textContent = result.recommended_action || 'Book a discovery call.';

    if (result.email_subject) {
      document.getElementById('subject-text').textContent = result.email_subject;
    }
    if (result.email_draft) {
      document.getElementById('email-body-display').innerHTML = result.email_draft.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }

    // Toggle Review Decision Action Bar for Needs Review leads
    if (reviewDecisionBar) {
      const q = String(result.qualification || '').toLowerCase();
      if (q.includes('needs') || q.includes('review') || (result.lead_score >= 45 && result.lead_score < 70)) {
        reviewDecisionBar.classList.remove('hidden');
      } else {
        reviewDecisionBar.classList.remove('hidden'); // keep visible for interactive decisions
      }
    }

    // Add activity items
    const activityContainer = document.getElementById('activity-list-container');
    if (activityContainer) {
      const timestamp = 'Just now';
      const leadName = leadData?.name || 'Lead';
      activityContainer.innerHTML = `
        <div class="activity-item">
          <i class="ph-fill ph-check-circle" style="color: #10B981;"></i>
          <span class="activity-text">Lead "${leadName}" evaluated</span>
          <span class="activity-time">${timestamp}</span>
        </div>
        <div class="activity-item">
          <i class="ph-fill ph-check-circle" style="color: #10B981;"></i>
          <span class="activity-text">Intent classified (${result.detected_intent})</span>
          <span class="activity-time">${timestamp}</span>
        </div>
        <div class="activity-item">
          <i class="ph-fill ph-check-circle" style="color: #10B981;"></i>
          <span class="activity-text">Scored ${result.lead_score}/100 (${qualText})</span>
          <span class="activity-time">${timestamp}</span>
        </div>
        <div class="activity-item">
          <i class="ph-fill ph-check-circle" style="color: #10B981;"></i>
          <span class="activity-text">Action: ${result.recommended_action || 'Review'}</span>
          <span class="activity-time">${timestamp}</span>
        </div>
      `;
    }
  }

  // Theme Management Logic (System, Light, Dark)
  // Theme Management Logic (System, Light, Dark)
  function setupThemeManagement() {
    applyTheme(currentThemeMode);

    // Segmented & Option Buttons (Header pill and user menu dropdown)
    document.querySelectorAll('.theme-option-btn, .theme-segment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.getAttribute('data-theme-mode');
        applyTheme(mode);
        userDropdownMenu?.classList.remove('active');
        const modeLabel = mode === 'system' ? 'System Theme' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
        showToast(`Appearance set to ${modeLabel}`);
      });
    });

    // Quick Celestial Flip Toggle Button Click Handler (Cycle: Light -> Dark -> System)
    const quickThemeBtn = document.getElementById('quick-theme-toggle-btn');
    if (quickThemeBtn) {
      quickThemeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cycle = { light: 'dark', dark: 'system', system: 'light' };
        const nextMode = cycle[currentThemeMode] || 'light';
        applyTheme(nextMode);
        const modeLabel = nextMode === 'system' ? 'System Theme' : `${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)} Mode`;
        showToast(`Theme switched to ${modeLabel} (Alt + T)`);
      });
    }

    // Global Keyboard Shortcut (Alt + T) to cycle theme modes
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const cycle = { light: 'dark', dark: 'system', system: 'light' };
        const nextMode = cycle[currentThemeMode] || 'light';
        applyTheme(nextMode);
        const modeLabel = nextMode === 'system' ? 'System Theme' : `${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)} Mode`;
        showToast(`Theme switched to ${modeLabel} (Alt + T)`);
      }
    });

    // Listen for OS System Theme Changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentThemeMode === 'system') {
        applyTheme('system');
      }
    });
  }

  function applyTheme(mode) {
    currentThemeMode = mode;
    localStorage.setItem('theme_mode', mode);

    // Trigger smooth CSS theme transition class
    document.body.classList.add('theme-transitioning');
    setTimeout(() => document.body.classList.remove('theme-transitioning'), 450);

    let effectiveTheme = mode;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    // Set dataset attributes for theme styling and button state
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-theme-active', mode);

    // Synchronize Segmented Switcher Buttons
    document.querySelectorAll('.theme-segment-btn').forEach(btn => {
      if (btn.getAttribute('data-theme-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Synchronize User Menu Theme Dropdown Items
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
      if (btn.getAttribute('data-theme-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Provider Presets & Interactive Switcher
  const providerPresets = {
    'PostgreSQL': {
      tab: 'tab-conn-string',
      connString: 'postgresql://admin:secret@pg-cluster.internal:5432/crm_production',
      host: 'postgres.internal.cloud',
      port: 5432,
      dbName: 'sales_crm',
      user: 'sales_admin'
    },
    'Salesforce': {
      tab: 'tab-api-key',
      apiToken: 'sf_token_live_998877665544332211',
      endpointUrl: 'https://acme.my.salesforce.com'
    },
    'HubSpot': {
      tab: 'tab-api-key',
      apiToken: 'pat_hs_live_77665544332211',
      endpointUrl: 'https://api.hubapi.com/crm/v3/objects/contacts'
    },
    'MySQL': {
      tab: 'tab-host-port',
      host: 'mysql.internal.cloud',
      port: 3306,
      dbName: 'crm_main',
      user: 'root'
    },
    'Notion': {
      tab: 'tab-api-key',
      apiToken: 'secret_notion_abc123xyz789',
      endpointUrl: 'https://api.notion.com/v1/databases/leads_db'
    },
    'Snowflake': {
      tab: 'tab-conn-string',
      connString: 'snowflake://user:pass@xy12345.us-east-1/LEADS_DB/PUBLIC'
    },
    'MongoDB': {
      tab: 'tab-conn-string',
      connString: 'mongodb+srv://admin:secret@cluster0.mongodb.net/sales_crm'
    },
    'Supabase': {
      tab: 'tab-conn-string',
      connString: 'postgresql://postgres:secret@db.supabase.co:5432/postgres'
    },
    'Google Sheets': {
      tab: 'tab-api-key',
      apiToken: 'ya29.a0AfH6SMB_google_sheets_token',
      endpointUrl: 'https://sheets.googleapis.com/v4/spreadsheets/1A2B3C'
    },
    'CSV File': {
      tab: 'tab-file-upload'
    },
    'CSV / File Upload': {
      tab: 'tab-file-upload'
    }
  };

  function setupProviderSelector() {
    const cards = document.querySelectorAll('#db-provider-selector .provider-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedProvider = card.getAttribute('data-provider');
        
        const preset = providerPresets[selectedProvider];
        if (preset) {
          if (preset.tab) {
            activateTab(preset.tab);
          }
          if (preset.connString) {
            document.getElementById('db-conn-string').value = preset.connString;
          }
          if (preset.host) {
            document.getElementById('db-host').value = preset.host;
          }
          if (preset.port) {
            document.getElementById('db-port').value = preset.port;
          }
          if (preset.dbName) {
            document.getElementById('db-name-input').value = preset.dbName;
          }
          if (preset.user) {
            document.getElementById('db-user').value = preset.user;
          }
          if (preset.apiToken) {
            document.getElementById('db-api-token').value = preset.apiToken;
          }
          if (preset.endpointUrl) {
            document.getElementById('db-endpoint-url').value = preset.endpointUrl;
          }
        }
      });
    });
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.tab-nav .tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTabId = tab.getAttribute('data-tab');
        activateTab(targetTabId);
      });
    });
  }

  function activateTab(tabId) {
    const tabs = document.querySelectorAll('.tab-nav .tab-btn');
    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === tabId) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    const tabMap = {
      'tab-conn-string': 'connection_string',
      'tab-host-port': 'host_port',
      'tab-api-key': 'api_key',
      'tab-file-upload': 'file_upload',
      'tab-webhook': 'webhook'
    };

    activeTabMode = tabMap[tabId] || tabId.replace('tab-', '').replace('-', '_');
  }

  function setupFileUpload() {
    const dropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `Selected: ${fileInput.files[0].name}`;
        showToast(`Selected file: ${fileInput.files[0].name}`);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        fileInput.files = files;
        fileNameDisplay.textContent = `Selected: ${files[0].name}`;
        showToast(`Loaded file: ${files[0].name}`);
      }
    });
  }

  // Interactive Services Modal
  function setupServicesModal() {
    const serviceCards = document.querySelectorAll('#services-catalog-grid .service-card');
    serviceCards.forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const title = card.querySelector('h3')?.textContent || 'Service Details';
        const badge = card.querySelector('.service-badge')?.textContent || 'Service';
        const desc = card.querySelector('.service-desc')?.textContent || '';
        const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent).join(', ');

        openModalWithResult({
          name: title,
          company: badge,
          lead_score: 98,
          qualification: 'Active Catalog',
          detected_intent: 'Matched Service Specification',
          matched_service: title,
          email_subject: `Specification & AI Matching Rule for ${title}`,
          email_draft: `Service Summary:\n${desc}\n\nKey Capabilities:\n${tags}\n\nAI Intent Classification Rule:\nInbound leads with high-fit problem descriptions in this category are automatically routed to "${title}" with personalized email drafts generated.`
        });
      });
    });
  }

  // Test DB Connection
  async function handleTestDatabaseConnection() {
    testDbBtn.disabled = true;
    testDbBtn.innerHTML = `<i class="ph ph-spinner spinner"></i> Testing...`;

    const payload = getDBPayload();

    try {
      const response = await fetch('/api/leads/databases/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      connectionStatusBox.classList.remove('hidden');

      if (response.ok && result.success) {
        connectionStatusBox.className = 'connection-status-box';
        document.getElementById('status-icon').className = 'status-indicator icon-success';
        document.getElementById('status-icon').innerHTML = `<i class="ph ph-check-circle"></i>`;
        document.getElementById('status-title').textContent = result.status_message;
        document.getElementById('status-sub').textContent = `Latency: ${result.latency_ms}ms | Version: ${result.database_version}`;
        showToast('Database test connection successful!');
      } else {
        connectionStatusBox.className = 'connection-status-box error';
        document.getElementById('status-icon').className = 'status-indicator icon-error';
        document.getElementById('status-icon').innerHTML = `<i class="ph ph-warning-circle"></i>`;
        document.getElementById('status-title').textContent = 'Connection Failed';
        document.getElementById('status-sub').textContent = result.detail || result.status_message || 'Could not verify database credentials';
        showToast('Connection test failed', 'error');
      }
    } catch (error) {
      console.error('Test DB error:', error);
      showToast('Error testing database connection', 'error');
    } finally {
      testDbBtn.disabled = false;
      testDbBtn.innerHTML = `<i class="ph ph-lightning"></i> Test Connection`;
    }
  }

  // Save & Connect DB
  async function handleSaveDatabaseConnection() {
    saveDbBtn.disabled = true;
    saveDbBtn.innerHTML = `<i class="ph ph-spinner spinner"></i> Connecting & Importing...`;

    let importedLeadIds = [];

    if (activeTabMode === 'file_upload') {
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput && fileInput.files.length > 0) {
        try {
          const file = fileInput.files[0];
          const text = await file.text();
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          
          if (lines.length > 1) {
            const parseCSVLine = (line) => {
              const result = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') { inQuotes = !inQuotes; }
                else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
                else { current += char; }
              }
              result.push(current.trim());
              return result;
            };

            const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));

            for (let i = 1; i < lines.length; i++) {
              const values = parseCSVLine(lines[i]);
              if (values.length >= 3) {
                const rowObj = {};
                headers.forEach((h, idx) => {
                  let val = values[idx] || '';
                  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                  rowObj[h] = val;
                });

                const leadPayload = {
                  name: rowObj.name || rowObj.contact_name || rowObj.full_name || 'CSV Contact',
                  email: rowObj.email || rowObj.email_address || `contact_${i}@csvimport.io`,
                  company: rowObj.company || rowObj.company_name || 'Enterprise Inc',
                  industry: rowObj.industry || 'Technology',
                  company_size: parseInt(rowObj.company_size || rowObj.size || '100'),
                  budget: parseFloat(rowObj.budget || '50000'),
                  timeline: rowObj.timeline || '1-3 months',
                  problem: rowObj.problem || rowObj.challenge || rowObj.notes || 'Imported via CSV file.',
                  source: rowObj.source || 'CSV File Import'
                };

                try {
                  const createRes = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadPayload)
                  });
                  if (createRes.ok) {
                    const createdLead = await createRes.json();
                    importedLeadIds.push(createdLead.id);
                  }
                } catch (e) { console.error('CSV row import error:', e); }
              }
            }

            dbModalOverlay.classList.remove('active');
            await fetchLeads();
            await fetchConnectedDatabases();

            if (importedLeadIds.length > 0) {
              const leadToRun = importedLeadIds[0];
              if (dashboardLeadSelect) dashboardLeadSelect.value = leadToRun;
              switchView('dashboard');
              await runAgentForLeadId(leadToRun, `Connected ${selectedProvider} & evaluated top lead!`);
            } else {
              showToast(`Imported leads from CSV "${file.name}"!`);
            }
            return;
          }
        } catch (fileErr) {
          console.error('File parse error:', fileErr);
          showToast('Failed to parse file', 'error');
          return;
        } finally {
          saveDbBtn.disabled = false;
          saveDbBtn.innerHTML = `<i class="ph ph-plug"></i> Connect &amp; Import Leads`;
        }
      }
    }

    const payload = getDBPayload();

    try {
      const response = await fetch('/api/leads/databases/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const importedLeads = await response.json();
        dbModalOverlay.classList.remove('active');
        await fetchLeads();
        await fetchConnectedDatabases();

        if (importedLeads.length > 0) {
          const topLead = importedLeads[0];
          if (dashboardLeadSelect) dashboardLeadSelect.value = topLead.id;
          switchView('dashboard');
          await runAgentForLeadId(topLead.id, `Connected ${selectedProvider} & evaluated top lead "${topLead.name}"!`);
        } else {
          showToast(`Successfully connected ${selectedProvider}!`);
        }
      } else {
        const err = await response.json();
        showToast(`Failed: ${err.detail || 'Could not connect database'}`, 'error');
      }
    } catch (error) {
      console.error('Save DB error:', error);
      showToast('An error occurred while connecting database', 'error');
    } finally {
      saveDbBtn.disabled = false;
      saveDbBtn.innerHTML = `<i class="ph ph-plug"></i> Connect &amp; Import Leads`;
    }
  }

  // Helper to run agent on specific lead and update Dashboard & local state
  async function runAgentForLeadId(leadId, customToastMsg = null) {
    try {
      const res = await fetch(`/api/agent/process/${leadId}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();

        // Mutate lead in local memory immediately
        const idx = currentLeads.findIndex(l => String(l.id) === String(leadId));
        if (idx !== -1) {
          currentLeads[idx] = { ...currentLeads[idx], ...result };
        }

        activeDisplayedLeadId = leadId;
        const leadObj = currentLeads.find(l => String(l.id) === String(leadId)) || { name: result.name };
        updateDashboardResultDisplay(result, leadObj);
        updateDashboardKPIs(currentLeads);
        populateDashboardLeadSelect(currentLeads);
        filterAndRenderLeads();
        renderAgentRunsTable();

        showToast(customToastMsg || `AI Agent evaluated ${leadObj.name || 'Lead'} (Score: ${result.lead_score})!`);
        await fetchLeads();
      }
    } catch (e) {
      console.error('Auto run agent error:', e);
    }
  }

  function getDBPayload() {
    let connType = activeTabMode;
    if (connType === 'conn_string') connType = 'connection_string';

    return {
      provider: selectedProvider,
      connection_type: connType,
      db_name: `${selectedProvider} Database`,
      connection_string: document.getElementById('db-conn-string').value,
      host: document.getElementById('db-host').value,
      port: parseInt(document.getElementById('db-port').value || '5432'),
      database_name: document.getElementById('db-name-input').value,
      username: document.getElementById('db-user').value,
      password: document.getElementById('db-pass').value,
      api_key: document.getElementById('db-api-token').value,
      endpoint_url: document.getElementById('db-endpoint-url').value,
      webhook_url: document.getElementById('db-webhook-url').value
    };
  }

  // Fetch API Calls
  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads');
      currentLeads = await res.json();
      updateDashboardKPIs(currentLeads);
      populateDashboardLeadSelect(currentLeads);
      filterAndRenderLeads();
      renderAgentRunsTable();
    } catch (err) {
      console.error('Fetch leads error:', err);
    }
  }

  async function fetchConnectedDatabases() {
    try {
      const res = await fetch('/api/leads/databases/list');
      currentDatabases = await res.json();
      renderConnectedDatabases();
    } catch (err) {
      console.error('Fetch databases error:', err);
    }
  }

  // Filter leads by date range
  function filterLeadsByDateRange(leads, range) {
    if (!leads || !Array.isArray(leads)) return [];
    if (range === 'all') return leads;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return leads.filter(l => {
      if (!l.created_at) return true;
      const leadDate = new Date(l.created_at);
      if (isNaN(leadDate.getTime())) return true;

      if (range === 'today') {
        const leadDateStr = leadDate.toISOString().split('T')[0];
        return leadDateStr === todayStr;
      } else if (range === '7days') {
        const diffDays = (now - leadDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      } else if (range === '30days') {
        const diffDays = (now - leadDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }

  // Fully Dynamic & Mathematically Exact Dashboard KPIs Calculator
  function updateDashboardKPIs(leads) {
    const filteredLeads = filterLeadsByDateRange(leads || [], selectedDateRange);

    // 1. Total Leads
    const totalCount = filteredLeads.length;
    document.getElementById('kpi-total-leads').textContent = totalCount;

    // 2. Qualified Leads (Count leads with score >= 70 or qualification/status === 'qualified')
    const qualifiedCount = filteredLeads.filter(l => {
      const q = String(l.qualification || '').toLowerCase().trim();
      const s = String(l.status || '').toLowerCase().trim();
      const score = Number(l.lead_score);
      return q === 'qualified' || s === 'qualified' || (!isNaN(score) && score >= 70);
    }).length;
    document.getElementById('kpi-qualified-leads').textContent = qualifiedCount;

    // 3. Avg Score (average score of all evaluated/scored leads)
    const scoredLeads = filteredLeads.filter(l => l.lead_score !== null && l.lead_score !== undefined && !isNaN(Number(l.lead_score)));
    const avgScore = scoredLeads.length > 0 
      ? Math.round(scoredLeads.reduce((acc, l) => acc + Number(l.lead_score), 0) / scoredLeads.length) 
      : 0;
    document.getElementById('kpi-avg-score').textContent = avgScore;

    // 4. Pending Review (leads not yet qualified or needing review)
    const pendingCount = filteredLeads.filter(l => {
      const q = String(l.qualification || '').toLowerCase().trim();
      const s = String(l.status || '').toLowerCase().trim();
      const score = Number(l.lead_score);
      const isQualified = q === 'qualified' || s === 'qualified' || (!isNaN(score) && score >= 70);
      return !isQualified;
    }).length;
    document.getElementById('kpi-pending-review').textContent = pendingCount;

    // Dynamically update trend indicators
    const totalTrendEl = document.getElementById('kpi-total-trend');
    const qualifiedTrendEl = document.getElementById('kpi-qualified-trend');
    const avgTrendEl = document.getElementById('kpi-avg-trend');
    const pendingTrendEl = document.getElementById('kpi-pending-trend');

    if (totalCount === 0) {
      if (totalTrendEl) totalTrendEl.innerHTML = `<span class="trend-text" style="color: var(--text-muted);">No data yet</span>`;
      if (qualifiedTrendEl) qualifiedTrendEl.innerHTML = `<span class="trend-text" style="color: var(--text-muted);">No data yet</span>`;
      if (avgTrendEl) avgTrendEl.innerHTML = `<span class="trend-text" style="color: var(--text-muted);">No data yet</span>`;
      if (pendingTrendEl) pendingTrendEl.innerHTML = `<span class="trend-text" style="color: var(--text-muted);">No data yet</span>`;
    } else {
      const qualPct = Math.round((qualifiedCount / totalCount) * 100);
      const pendPct = Math.round((pendingCount / totalCount) * 100);

      if (totalTrendEl) {
        totalTrendEl.innerHTML = `<div class="kpi-trend trend-up"><i class="ph ph-arrow-up"></i><span>${totalCount}</span> <span class="trend-text">total recorded</span></div>`;
      }
      if (qualifiedTrendEl) {
        qualifiedTrendEl.innerHTML = `<div class="kpi-trend trend-up"><i class="ph ph-arrow-up"></i><span>${qualPct}%</span> <span class="trend-text">conversion rate</span></div>`;
      }
      if (avgTrendEl) {
        avgTrendEl.innerHTML = `<div class="kpi-trend trend-up"><i class="ph ph-trend-up"></i><span>${avgScore} pts</span> <span class="trend-text">avg score</span></div>`;
      }
      if (pendingTrendEl) {
        pendingTrendEl.innerHTML = `<div class="kpi-trend ${pendingCount > 0 ? 'trend-down' : 'trend-up'}"><i class="ph ph-clock"></i><span>${pendPct}%</span> <span class="trend-text">in pipeline</span></div>`;
      }
    }
  }

  // Render & Filter Leads
  function filterAndRenderLeads() {
    if (!leadsList) return;

    const query = (searchInput?.value || '').toLowerCase().trim();
    const statusVal = statusFilter?.value || 'all';

    const filtered = currentLeads.filter(lead => {
      const matchQuery = !query || 
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.problem.toLowerCase().includes(query) ||
        (lead.detected_intent && lead.detected_intent.toLowerCase().includes(query));

      const isQualified = (lead.qualification || '').toLowerCase() === 'qualified' || (lead.status || '').toLowerCase() === 'qualified' || Number(lead.lead_score) >= 70;
      const isNeedsReview = (lead.qualification || '').toLowerCase().includes('needs') || (lead.qualification || '').toLowerCase().includes('review') || (lead.status || '').toLowerCase().includes('needs') || (lead.status || '').toLowerCase().includes('review') || (Number(lead.lead_score) >= 45 && Number(lead.lead_score) < 70);
      const isDisqualified = (lead.qualification || '').toLowerCase().includes('unqualified') || (lead.status || '').toLowerCase().includes('unqualified');
      const isNew = (!lead.qualification && !lead.lead_score) || lead.status === 'new';

      const matchStatus = statusVal === 'all' || 
        (statusVal === 'Qualified' && isQualified) ||
        (statusVal === 'Needs Review' && (isNeedsReview || isNew)) ||
        (statusVal === 'Needs Info' && isNeedsReview) ||
        (statusVal === 'Disqualified' && isDisqualified) ||
        (statusVal === 'new' && isNew);

      return matchQuery && matchStatus;
    });

    renderLeadsGrid(filtered);
  }

  function renderLeadsGrid(leads) {
    leadsList.innerHTML = '';
    if (leads.length === 0) {
      leadsList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
          <i class="ph ph-users" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
          <h3>No leads found</h3>
          <p style="color: var(--text-muted);">Create a new lead or import an external database to populate leads.</p>
        </div>
      `;
      return;
    }

    leads.forEach(lead => {
      const card = document.createElement('div');
      card.className = 'lead-card';

      const badgeClass = getBadgeClass(lead.qualification, lead.status);
      const qualText = lead.qualification 
        ? lead.qualification.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
        : 'New';

      card.innerHTML = `
        <div class="lead-header">
          <div>
            <div class="lead-name">${lead.name}</div>
            <div class="lead-company">${lead.company} &bull; ${lead.source || 'Direct'}</div>
          </div>
          <span class="${badgeClass}">${qualText}</span>
        </div>
        <div class="lead-problem">
          <strong>Problem:</strong> ${lead.problem}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 1rem;">
          <span>Email: ${lead.email}</span>
          ${lead.lead_score !== null && lead.lead_score !== undefined ? `<strong style="color: var(--primary-color);">Score: ${lead.lead_score}</strong>` : ''}
        </div>
        <div class="action-buttons">
          <button class="btn-primary run-agent-btn" data-id="${lead.id}">
            <i class="ph ph-play"></i> Run Agent
          </button>
          ${lead.lead_score !== null && lead.lead_score !== undefined ? `
            <button class="btn-secondary view-results-btn" data-id="${lead.id}">
              <i class="ph ph-eye"></i> View Results
            </button>
          ` : ''}
        </div>
      `;
      leadsList.appendChild(card);
    });

    document.querySelectorAll('.run-agent-btn').forEach(b => b.addEventListener('click', handleRunAgent));
    document.querySelectorAll('.view-results-btn').forEach(b => b.addEventListener('click', handleViewResults));
  }

  // Agent Run Action Handlers
  async function handleRunAgent(e) {
    const btn = e.currentTarget;
    const leadId = btn.getAttribute('data-id');
    
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner spinner"></i> Running...`;

    try {
      await runAgentForLeadId(leadId);
    } catch (err) {
      console.error(err);
      showToast('Error running agent', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="ph ph-play"></i> Run Agent`;
    }
  }

  async function handleViewResults(e) {
    const leadId = e.currentTarget.getAttribute('data-id');
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const lead = await res.json();
        activeDisplayedLeadId = lead.id;
        openModalWithResult({
          name: lead.name,
          company: lead.company,
          lead_score: lead.lead_score,
          qualification: lead.qualification,
          detected_intent: lead.detected_intent,
          matched_service: 'AI Sales Qualification Agent',
          email_subject: lead.email_subject,
          email_draft: lead.email_draft
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openModalWithResult(data) {
    document.getElementById('modal-lead-name').textContent = data.name || 'Lead';
    document.getElementById('modal-lead-company').textContent = data.company ? `- ${data.company}` : '';
    document.getElementById('modal-lead-score').textContent = data.lead_score !== null && data.lead_score !== undefined ? data.lead_score : 'N/A';
    
    const qualSpan = document.getElementById('modal-qualification');
    const qualText = (data.qualification || 'Qualified').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    qualSpan.textContent = qualText;
    qualSpan.className = getBadgeClass(data.qualification, data.status);

    document.getElementById('modal-intent').textContent = (data.detected_intent || 'N/A').replace(/_/g, ' ');
    document.getElementById('modal-service').textContent = data.matched_service || 'AI Sales Qualification Agent';

    document.getElementById('modal-email-subject').textContent = data.email_subject || 'Subject: Solutions for outreach automation';
    document.getElementById('modal-email-body').textContent = data.email_draft || 'No draft generated.';

    modalOverlay.classList.add('active');
  }

  // Render Agent Runs Table
  function renderAgentRunsTable() {
    const tbody = document.getElementById('agent-runs-table-body');
    if (!tbody) return;

    const processedLeads = currentLeads.filter(l => l.lead_score !== null && l.lead_score !== undefined);

    if (processedLeads.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">
            No agent runs logged yet. Click 'Run Agent' on any lead to generate runs.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = processedLeads.map(l => `
      <tr>
        <td>#RUN-${l.id + 100}</td>
        <td><strong>${l.name}</strong></td>
        <td>${l.company}</td>
        <td><span class="${getBadgeClass(l.qualification, l.status)}">${l.qualification ? l.qualification.replace(/_/g, ' ') : 'Needs Review'}</span></td>
        <td><strong style="color: var(--primary-color);">${l.lead_score}</strong></td>
        <td>AI Qualification Agent</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.email_subject || 'Generated'}</td>
        <td>
          <button class="btn-outline btn-sm run-agent-btn" data-id="${l.id}">Re-run</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.run-agent-btn').forEach(b => b.addEventListener('click', handleRunAgent));
  }

  // Render Connected Databases List
  function renderConnectedDatabases() {
    const container = document.getElementById('connected-databases-container');
    if (!container) return;

    if (currentDatabases.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i class="ph ph-database" style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem; opacity: 0.35;"></i>
          <p style="font-size: 0.9rem; font-weight: 500;">No external databases or integrations connected yet.</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Click 'Connect New DB' above to sync PostgreSQL, Salesforce, HubSpot, or custom databases.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = currentDatabases.map(db => `
      <div class="connected-db-item">
        <div class="db-info">
          <div class="db-icon"><i class="ph ph-database"></i></div>
          <div>
            <div class="db-name">${db.name}</div>
            <div class="db-details">${db.provider} &bull; ${db.connection_type} &bull; ${db.records_count} records &bull; Last sync: ${db.last_sync}</div>
          </div>
        </div>
        <div class="db-actions">
          <button class="btn-outline btn-sm sync-db-btn" data-id="${db.id}"><i class="ph ph-arrows-clockwise"></i> Sync Now</button>
          <button class="btn-danger btn-sm disconnect-db-btn" data-id="${db.id}"><i class="ph ph-trash"></i></button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.sync-db-btn').forEach(b => {
      b.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        showToast('Syncing database...');
        try {
          const res = await fetch(`/api/leads/databases/${id}/sync`, { method: 'POST' });
          if (res.ok) {
            showToast('Database synced successfully!');
            await loadInitialData();
          }
        } catch (err) {
          showToast('Sync failed', 'error');
        }
      });
    });

    container.querySelectorAll('.disconnect-db-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        confirmModalMessage.textContent = 'Are you sure you want to disconnect this database?';
        confirmCallback = async () => {
          await fetch(`/api/leads/databases/${id}`, { method: 'DELETE' });
          showToast('Database disconnected.');
          await fetchConnectedDatabases();
        };
        confirmModalOverlay.classList.add('active');
      });
    });
  }

  // Prompt Clear All Data
  function promptClearData() {
    confirmModalMessage.textContent = 'Are you sure you want to clear all leads? This action cannot be undone.';
    confirmCallback = async () => {
      try {
        const response = await fetch('/api/leads', { method: 'DELETE' });
        if (response.ok) {
          showToast('All leads cleared');
          await fetchLeads();
        }
      } catch (err) {
        showToast('Failed to clear leads', 'error');
      }
    };
    confirmModalOverlay.classList.add('active');
  }

  // Services Catalog Knowledge Base Renderer
  async function fetchAndRenderServicesCatalog() {
    const grid = document.getElementById('services-catalog-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/agent/services');
      let servicesData = {};
      if (res.ok) {
        servicesData = await res.json();
      } else {
        servicesData = {
          "ai_sales_agent": {
            "service_name": "AI Sales Qualification Agent",
            "description": "A custom AI sales assistant that qualifies incoming leads, assigns lead scores, identifies customer intent, recommends next actions, drafts personalized follow-up emails, and updates CRM records.",
            "starting_price": 7500,
            "estimated_price_range": { "minimum": 7500, "maximum": 18000 },
            "delivery_time": "6 to 10 weeks",
            "next_step": "Book a discovery call to review the sales process, lead sources, qualification rules, CRM platform, and required integrations."
          },
          "customer_support_automation": {
            "service_name": "AI Customer Support Automation",
            "description": "An AI-powered support system that answers common customer questions, classifies support requests, searches an approved knowledge base, escalates complex cases, and records support activity.",
            "starting_price": 6000,
            "estimated_price_range": { "minimum": 6000, "maximum": 15000 },
            "delivery_time": "5 to 9 weeks",
            "next_step": "Review support channels, ticket volume, knowledge sources, escalation policies, and integration requirements."
          },
          "rag_document_chatbot": {
            "service_name": "RAG Document Q&A Chatbot",
            "description": "A document question-answering application that processes company files, creates semantic embeddings, retrieves relevant passages, generates grounded answers, and provides source references.",
            "starting_price": 4000,
            "estimated_price_range": { "minimum": 4000, "maximum": 10000 },
            "delivery_time": "4 to 7 weeks",
            "next_step": "Review document formats, document volume, access permissions, expected users, security requirements, and target deployment environment."
          },
          "workflow_automation": {
            "service_name": "Enterprise AI Workflow Automation",
            "description": "A custom automation system that coordinates repetitive business tasks, approvals, notifications, data transfers, LLM decisions, and integrations with external applications.",
            "starting_price": 6500,
            "estimated_price_range": { "minimum": 6500, "maximum": 20000 },
            "delivery_time": "6 to 12 weeks",
            "next_step": "Map the existing workflow, identify manual bottlenecks, define approval rules, and review the systems that must be integrated."
          },
          "data_extraction": {
            "service_name": "Intelligent Document Data Extraction",
            "description": "An AI document-processing solution that extracts structured fields from invoices, receipts, forms, contracts, and other business documents, validates results, and exports data to approved systems.",
            "starting_price": 5000,
            "estimated_price_range": { "minimum": 5000, "maximum": 14000 },
            "delivery_time": "5 to 9 weeks",
            "next_step": "Review representative documents, required output fields, expected document volume, validation rules, and destination systems."
          },
          "other": {
            "service_name": "Custom AI Solution & Technical Discovery",
            "description": "A custom AI application designed after evaluating the client's business problem, available data, security requirements, integrations, deployment environment, and success criteria.",
            "starting_price": 3500,
            "estimated_price_range": { "minimum": 3500, "maximum": 25000 },
            "delivery_time": "Determined after discovery",
            "next_step": "Schedule a discovery call to define requirements, scope, risks, integrations, deliverables, and a realistic implementation estimate."
          }
        };
      }

      const metaMap = {
        ai_sales_agent: { badge: 'Core Sales AI', icon: 'ph-robot', tags: ['Lead Scoring', 'Intent Analysis', 'Outreach', 'CRM Sync'] },
        customer_support_automation: { badge: 'Support & Helpdesk', icon: 'ph-headset', tags: ['Knowledge Base', 'Ticket Routing', 'Smart Escalation'] },
        rag_document_chatbot: { badge: 'RAG & Knowledge', icon: 'ph-file-text', tags: ['Semantic Search', 'Vector Embeddings', 'Citations'] },
        workflow_automation: { badge: 'Enterprise Automation', icon: 'ph-gear-six', tags: ['Multi-App Sync', 'LLM Nodes', 'Automated Approvals'] },
        data_extraction: { badge: 'OCR & Document AI', icon: 'ph-file-search', tags: ['Invoice Parsing', 'Contract Extraction', 'Structured Export'] },
        other: { badge: 'Custom Engineering', icon: 'ph-sparkle', tags: ['Technical Discovery', 'Custom Architecture', 'Tailored LLM'] }
      };

      grid.innerHTML = Object.entries(servicesData).map(([key, item]) => {
        const meta = metaMap[key] || { badge: 'AI Service', icon: 'ph-briefcase', tags: ['AI Solution'] };
        const priceMin = item.estimated_price_range?.minimum ? `$${item.estimated_price_range.minimum.toLocaleString()}` : `$${item.starting_price.toLocaleString()}`;
        const priceMax = item.estimated_price_range?.maximum ? `$${item.estimated_price_range.maximum.toLocaleString()}` : '';
        const priceStr = priceMax ? `${priceMin} – ${priceMax} USD` : `Starting at ${priceMin} USD`;

        return `
          <div class="card service-card">
            <div class="service-card-header">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span class="service-badge"><i class="ph ${meta.icon}"></i> ${meta.badge}</span>
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary-color); background: var(--primary-light); padding: 0.2rem 0.5rem; border-radius: 6px;">Intent: ${key}</span>
              </div>
              <h3 style="margin-top: 0.5rem; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${item.service_name}</h3>
            </div>
            
            <p class="service-desc" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">${item.description}</p>
            
            <div style="display: flex; flex-direction: column; gap: 0.4rem; padding: 0.75rem; background: var(--bg-main); border-radius: 10px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted); font-weight: 600;"><i class="ph ph-currency-dollar" style="color: var(--success-color);"></i> Est. Investment:</span>
                <strong style="color: var(--text-main); font-weight: 700;">${priceStr}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted); font-weight: 600;"><i class="ph ph-clock" style="color: var(--primary-color);"></i> Delivery Time:</span>
                <strong style="color: var(--text-main); font-weight: 700;">${item.delivery_time}</strong>
              </div>
            </div>

            <div style="font-size: 0.78rem; background: rgba(13, 148, 136, 0.06); border-left: 3px solid var(--primary-color); padding: 0.55rem 0.75rem; border-radius: 0 8px 8px 0; margin-bottom: 1.1rem; color: var(--text-main);">
              <strong>Recommended Action:</strong> ${item.next_step}
            </div>

            <div class="service-tags" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: auto;">
              ${meta.tags.map(t => `<span class="tag" style="font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 6px; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted);">${t}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Render services catalog error:', err);
    }
  }
});
