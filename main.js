// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, push, remove, update, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1xw7U1A7vLA9XAPzPmKTfZ-MdtEdTiNc",
  authDomain: "sc-project-tracking.firebaseapp.com",
  databaseURL: "https://sc-project-tracking-default-rtdb.firebaseio.com",
  projectId: "sc-project-tracking",
  storageBucket: "sc-project-tracking.appspot.com",
  messagingSenderId: "934713747712",
  appId: "1:934713747712:web:15a9bd6e8a86818d37ebe5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Variables to store data
let projects = [];
let employees = [];
let operations = [];
let workLogs = [];
let clients = [];

document.addEventListener('DOMContentLoaded', () => {
  // Load data from Firebase
  function loadData() {
    return Promise.all([
      get(ref(db, 'projects')),
      get(ref(db, 'employees')),
      get(ref(db, 'operations')),
      get(ref(db, 'workLogs')),
      get(ref(db, 'clients')),
      get(ref(db, 'settings'))
    ]).then(([projectsSnapshot, employeesSnapshot, operationsSnapshot, workLogsSnapshot, clientsSnapshot, settingsSnapshot]) => {
      console.log('Data loaded:', {
        projects: projectsSnapshot.val(),
        employees: employeesSnapshot.val(),
        operations: operationsSnapshot.val(),
        workLogs: workLogsSnapshot.val(),
        clients: clientsSnapshot.val(),
        settings: settingsSnapshot.val()
      });
  
      projects = projectsSnapshot.val() ? Object.values(projectsSnapshot.val()) : [];
      employees = employeesSnapshot.val() ? Object.values(employeesSnapshot.val()) : [];
      operations = operationsSnapshot.val() ? Object.values(operationsSnapshot.val()) : [];
      workLogs = workLogsSnapshot.val() ? Object.values(workLogsSnapshot.val()) : [];
      clients = clientsSnapshot.val() ? Object.values(clientsSnapshot.val()) : [];

      renderProjects();
      renderCompletedProjects();
      renderAdminProjects();
      renderEmployees();
      renderWorkLogs();
      renderClients();
      renderOperations();
  
      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.val();
        applySettings(settings);
      }
  
      setupImprovedSearch();
      startActiveTimers();
    }).catch(error => {
      console.error("Error loading data:", error);
      showNotification('Failed to load data. Please check console for details.', 'error');
    });
  }

  // Initial data load
  loadData();

  // Set up real-time listeners
  setupRealtimeListeners();

  function setupRealtimeListeners() {
    const projectsRef = ref(db, 'projects');
    onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        projects = Object.values(snapshot.val());
      } else {
        projects = [];
      }
      renderProjects();
      renderCompletedProjects();
      renderAdminProjects();
    }); 

    const employeesRef = ref(db, 'employees');
    onValue(employeesRef, (snapshot) => {
      employees = snapshot.exists() ? Object.values(snapshot.val()) : [];
      renderEmployees();
    });

    const operationsRef = ref(db, 'operations');
    onValue(operationsRef, (snapshot) => {
      operations = snapshot.exists() ? Object.values(snapshot.val()) : [];
      renderOperations();
    });

    const workLogsRef = ref(db, 'workLogs');
    onValue(workLogsRef, (snapshot) => {
      workLogs = snapshot.exists() ? Object.values(snapshot.val()) : [];
      renderWorkLogs();
    });
    
    const clientsRef = ref(db, 'clients');
    onValue(clientsRef, (snapshot) => {
      clients = snapshot.exists() ? Object.values(snapshot.val()) : [];
      renderClients();
    });
  }

  function applySettings(settings) {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
      document.getElementById('theme-color').value = settings.primaryColor;
    }
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor);
      document.getElementById('accent-color').value = settings.accentColor;
    }
    if (settings.fontFamily) {
      document.documentElement.style.setProperty('--font-family', settings.fontFamily);
      document.getElementById('font-select').value = settings.fontFamily;
    }
    document.getElementById('layout-select').value = settings.layoutStyle || 'list';
    document.getElementById('default-priority').value = settings.defaultPriority || 'medium';
    const defaultEmployeesSelect = document.getElementById('default-employees');
    loadEmployeesToSelect(defaultEmployeesSelect);
    Array.from(defaultEmployeesSelect.options).forEach((option) => {
      option.selected = settings.defaultEmployees?.includes(option.value);
    });
  }

  // Save settings to Firebase
  function saveSettings() {
    const settings = {
      primaryColor: document.getElementById('theme-color').value,
      accentColor: document.getElementById('accent-color').value,
      fontFamily: document.getElementById('font-select').value,
      layoutStyle: document.getElementById('layout-select').value,
      defaultPriority: document.getElementById('default-priority').value,
      defaultEmployees: Array.from(document.getElementById('default-employees').selectedOptions).map(
        (option) => option.value
      ),
    };

    set(ref(db, 'settings'), settings)
      .then(() => {
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);

        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        showNotification('Settings saved successfully', 'success');
      })
      .catch((error) => {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings. Please try again.', 'error');
      });
  }

  // Add event listeners to save settings when changed
  document.getElementById('theme-color').addEventListener('change', saveSettings);
  document.getElementById('accent-color').addEventListener('change', saveSettings);
  document.getElementById('font-select').addEventListener('change', saveSettings);
  document.getElementById('layout-select').addEventListener('change', saveSettings);
  document.getElementById('default-priority').addEventListener('change', saveSettings);
  document.getElementById('default-employees').addEventListener('change', saveSettings);

  // Toggle Side Menu
  const menuIcon = document.getElementById('menu-icon');
  const sideMenu = document.getElementById('side-menu');

  menuIcon.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
  });

  // Close Side Menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!sideMenu.contains(event.target) && !menuIcon.contains(event.target)) {
      sideMenu.classList.remove('active');
    }
  });

  // Show and Hide Content Sections
  function showSection(sectionId) {
    document.querySelectorAll('.content').forEach((content) => {
      content.style.display = 'none';
    });
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
    }
    sideMenu.classList.remove('active');

    // Render appropriate content
    switch(sectionId) {
      case 'project-list':
        renderProjects();
        break;
      case 'completed-projects':
        renderCompletedProjects();
        break;
      case 'employee-list':
        renderEmployees();
        break;
      case 'work-log':
        renderWorkLogs();
        break;
      case 'client-list':
        renderClients();
        break;
      case 'settings-page':
        renderOperations();
        loadEmployeesToSelect(document.getElementById('default-employees'));
        break;
      case 'admin-view':
        renderAdminProjects();
        break;
    }
  }

  // Ensure navigation buttons are working
  document.getElementById('show-project-list-btn').addEventListener('click', () => showSection('project-list'));
  document.getElementById('show-completed-projects-btn').addEventListener('click', () => showSection('completed-projects'));
  document.getElementById('show-employee-list-btn').addEventListener('click', () => showSection('employee-list'));
  document.getElementById('show-work-log-btn').addEventListener('click', () => showSection('work-log'));
  document.getElementById('show-settings-btn').addEventListener('click', () => showSection('settings-page'));
  document.getElementById('show-client-list-btn').addEventListener('click', () => showSection('client-list'));
  document.getElementById('show-admin-view-btn').addEventListener('click', () => showSection('admin-view'));

  // Initially show the project list section
  showSection('project-list');

  // Modals
  const projectModal = document.getElementById('project-modal');
  const closeProjectModalBtn = document.getElementById('close-project-modal');
  const addProjectBtn = document.getElementById('add-project-btn');
  const saveProjectBtn = document.getElementById('save-project-btn');
  const projectForm = document.getElementById('project-form');

  const employeeModal = document.getElementById('employee-modal');
  const closeEmployeeModalBtn = document.getElementById('close-employee-modal');
  const addEmployeeBtn = document.getElementById('add-employee-btn');
  const saveEmployeeBtn = document.getElementById('save-employee-btn');
  const employeeForm = document.getElementById('employee-form');

  const operationModal = document.getElementById('operation-modal');
  const closeOperationModalBtn = document.getElementById('close-operation-modal');
  const startOperationBtn = document.getElementById('start-operation-btn');
  const cancelOperationBtn = document.getElementById('cancel-operation-btn');
  const operationForm = document.getElementById('operation-form');

  const projectDetailsModal = document.getElementById('project-details-modal');
  const closeProjectDetailsModalBtn = document.getElementById('close-project-details-modal');
  const projectDetailsContent = document.getElementById('project-details-content');

  const clientModal = document.getElementById('client-modal');
  const closeClientModalBtn = document.getElementById('close-client-modal');
  const addClientBtn = document.getElementById('add-client-btn');
  const saveClientBtn = document.getElementById('save-client-btn');
  const clientForm = document.getElementById('client-form');

  const editLogModal = document.getElementById('edit-log-modal');
  const closeEditLogModalBtn = editLogModal.querySelector('.close');
  const editLogContent = document.getElementById('edit-log-content');

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target == projectModal) {
      projectModal.style.display = 'none';
    }
    if (event.target == employeeModal) {
      employeeModal.style.display = 'none';
    }
    if (event.target == operationModal) {
      operationModal.style.display = 'none';
    }
    if (event.target == projectDetailsModal) {
      projectDetailsModal.style.display = 'none';
    }
    if (event.target == clientModal) {
      clientModal.style.display = 'none';
    }
    if (event.target == editLogModal) {
      editLogModal.style.display = 'none';
    }
  });

  // Add Project Modal
  addProjectBtn.addEventListener('click', () => {
    loadEmployeesToSelect(document.getElementById('project-employees'));
    loadClientsToSelect(document.getElementById('project-client'));
    get(ref(db, 'settings/defaultEmployees')).then((snapshot) => {
      if (snapshot.exists()) {
        const defaultEmployees = snapshot.val();
        const projectEmployeesSelect = document.getElementById('project-employees');
        Array.from(projectEmployeesSelect.options).forEach((option) => {
          option.selected = defaultEmployees.includes(option.value);
        });
      }
    });
    get(ref(db, 'settings/defaultPriority')).then((snapshot) => {
      if (snapshot.exists()) {
        document.getElementById('project-priority').value = snapshot.val();
      } else {
        document.getElementById('project-priority').value = 'medium';
      }
    });
    projectModal.style.display = 'block';
  });

  closeProjectModalBtn.addEventListener('click', () => {
    projectModal.style.display = 'none';
    projectForm.reset();
    saveProjectBtn.onclick = saveNewProject;
  });

  saveProjectBtn.onclick = saveNewProject;

  function saveNewProject() {
    const projectData = {
      id: generateId(),
      name: document.getElementById('project-name').value,
      purchaseOrder: document.getElementById('purchase-order').value || '',
      partNumber: document.getElementById('part-number').value || '',
      jobNumber: document.getElementById('job-number').value || '',
      dueDate: document.getElementById('due-date').value || '',
      quantity: document.getElementById('quantity').value || '',
      notes: document.getElementById('notes').value || '',
      assignedEmployees: Array.from(document.getElementById('project-employees').selectedOptions).map(
        (option) => option.value
      ) || [],
      priority: document.getElementById('project-priority').value || 'medium',
      status: 'Not Started',
      clientId: document.getElementById('project-client').value || '',
      estimatedTime: parseFloat(document.getElementById('estimated-time').value) || 0,
      manualTime: parseFloat(document.getElementById('manual-time').value) || 0,
      actualTime: parseFloat(document.getElementById('manual-time').value) || 0
    };
  
    try {
      validateProjectData(projectData);
      
      set(ref(db, `projects/${projectData.id}`), projectData)
        .then(() => {
          projectModal.style.display = 'none';
          projectForm.reset();
          showNotification('Project saved successfully', 'success');
        })
        .catch((error) => {
          console.error('Error saving project:', error);
          showNotification('Failed to save project: ' + error.message, 'error');
        });
    } catch (error) {
      console.error('Validation error:', error);
      showNotification('Invalid project data: ' + error.message, 'error');
    }
  }

  // Add Employee Modal
  addEmployeeBtn.addEventListener('click', () => {
    employeeModal.style.display = 'block';
  });
  closeEmployeeModalBtn.addEventListener('click', () => {
    employeeModal.style.display = 'none';
    employeeForm.reset();
  });

  saveEmployeeBtn.addEventListener('click', () => {
    const employeeName = document.getElementById('employee-name').value.trim();
    if (employeeName) {
      const newEmployee = { id: generateId(), name: employeeName };
      set(ref(db, `employees/${newEmployee.id}`), newEmployee)
        .then(() => {
          employees.push(newEmployee);
          renderEmployees();
          employeeModal.style.display = 'none';
          employeeForm.reset();
          showNotification('Employee added successfully', 'success');
        })
        .catch((error) => {
          console.error('Error adding employee:', error);
          showNotification('Failed to add employee. Please try again.', 'error');
        });
    } else {
      showNotification('Please enter a valid employee name.', 'warning');
    }
  });

  // Operation Modal
  closeOperationModalBtn.addEventListener('click', () => {
    operationModal.style.display = 'none';
    operationForm.reset();
  });

  startOperationBtn.addEventListener('click', () => {
    const operation = document.getElementById('operation-select').value;
    const selectedEmployeeIds = Array.from(document.getElementById('operation-employees').selectedOptions).map(
      (option) => option.value
    );
    if (operation && selectedEmployeeIds.length > 0) {
      const projectId = operationModal.getAttribute('data-project-id');
      selectedEmployeeIds.forEach((employeeId) => {
        startEmployeeOperation(projectId, employeeId, operation);
      });
      operationModal.style.display = 'none';
      operationForm.reset();
    } else {
      showNotification('Please select an operation and at least one employee.', 'warning');
    }
  });

  cancelOperationBtn.addEventListener('click', () => {
    operationModal.style.display = 'none';
    operationForm.reset();
  });

  function showEmployeeOperationModal(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const operationModal = document.getElementById('operation-modal');
      operationModal.style.display = 'block';
      operationModal.setAttribute('data-project-id', projectId);
      loadOperationsToSelect();
      loadAssignedEmployeesToOperationSelect(project.assignedEmployees);
    }
  }

  function loadOperationsToSelect() {
    const operationSelect = document.getElementById('operation-select');
    operationSelect.innerHTML = '';
    if (Array.isArray(operations)) {
      operations.forEach((op) => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        operationSelect.appendChild(option);
      });
    } else {
      console.error('Operations is not an array:', operations);
    }
  }

  function loadAssignedEmployeesToOperationSelect(assignedEmployeeIds = []) {
    const operationEmployeesSelect = document.getElementById('operation-employees');
    operationEmployeesSelect.innerHTML = '';

    assignedEmployeeIds = assignedEmployeeIds.map(String);

    employees.forEach((employee) => {
      if (assignedEmployeeIds.length === 0 || assignedEmployeeIds.includes(employee.id)) {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        operationEmployeesSelect.appendChild(option);
      }
    });

    if (operationEmployeesSelect.options.length === 0) {
      const defaultOption = document.createElement('option');
      defaultOption.textContent = 'No employees available';
      operationEmployeesSelect.appendChild(defaultOption);
    }
  }

  // Client Modal
  addClientBtn.addEventListener('click', () => {
    clientModal.style.display = 'block';
  });

  closeClientModalBtn.addEventListener('click', () => {
    clientModal.style.display = 'none';
    clientForm.reset();
    saveClientBtn.onclick = saveNewClient;
  });

  saveClientBtn.onclick = saveNewClient;

  function saveNewClient() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientContact = document.getElementById('client-contact').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const clientEmail = document.getElementById('client-email').value.trim();
    const clientAddress = document.getElementById('client-address').value.trim();

    if (clientName) {
      const newClient = {
        id: generateId(),
        name: clientName,
        contact: clientContact,
        phone: clientPhone,
        email: clientEmail,
        address: clientAddress,
      };
      set(ref(db, `clients/${newClient.id}`), newClient)
        .then(() => {
          clients.push(newClient);
          renderClients();
          clientModal.style.display = 'none';
          clientForm.reset();
          showNotification('Client added successfully', 'success');
        })
        .catch((error) => {
          console.error('Error adding client:', error);
          showNotification('Failed to add client. Please try again.', 'error');
        });
    } else {
      showNotification('Please enter a valid client name.', 'warning');
    }
  }

  // Render Clients
  function renderClients(filteredClients = null) {
    const clientsContainer = document.getElementById('clients');
    clientsContainer.innerHTML = '';

    const clientsToRender = filteredClients || clients;

    clientsToRender.forEach((client) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="client-name">${client.name}</span>
        <div class="client-actions">
          <button class="edit-client-btn btn-secondary">Edit</button>
          <button class="delete-client-btn btn-danger">Delete</button>
        </div>
      `;

      const editBtn = li.querySelector('.edit-client-btn');
      editBtn.addEventListener('click', () => {
        editClient(client);
      });

      const deleteBtn = li.querySelector('.delete-client-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this client?')) {
          deleteClient(client.id);
        }
      });

      clientsContainer.appendChild(li);
    });
  }

  function editClient(client) {
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-contact').value = client.contact || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-address').value = client.address || '';

    clientModal.style.display = 'block';

    saveClientBtn.onclick = function () {
      updateClient(client.id);
    };
  }

  function updateClient(clientId) {
    const updatedClient = {
      name: document.getElementById('client-name').value,
      contact: document.getElementById('client-contact').value,
      phone: document.getElementById('client-phone').value,
      email: document.getElementById('client-email').value,
      address: document.getElementById('client-address').value
    };

    update(ref(db, `clients/${clientId}`), updatedClient)
      .then(() => {
        console.log('Client updated successfully');
        clientModal.style.display = 'none';
        loadData(); // Reload data to reflect changes
        showNotification('Client updated successfully', 'success');
      })
      .catch((error) => {
        console.error('Error updating client:', error);
        showNotification('Failed to update client. Please try again.', 'error');
      });
  }

  function deleteClient(clientId) {
    remove(ref(db, `clients/${clientId}`))
      .then(() => {
        console.log('Client deleted successfully');
        loadData(); // Reload data to reflect changes
        showNotification('Client deleted successfully', 'success');
      })
      .catch((error) => {
        console.error('Error deleting client:', error);
        showNotification('Failed to delete client. Please try again.', 'error');
      });
  }

  // Render Projects
  function renderProjects(filteredProjects = null) {
    console.log('Rendering projects');
    const projectsContainer = document.getElementById('projects');
    projectsContainer.innerHTML = '';
  
    const layoutStyle = document.getElementById('layout-select').value || 'grid';
    if (layoutStyle === 'list') {
      projectsContainer.classList.add('list-view');
    } else {
      projectsContainer.classList.remove('list-view');
    }
  
    const projectsToRender = filteredProjects || projects;
    const activeProjects = projectsToRender.filter((p) => p.status !== 'Completed');
    const projectsByClient = groupProjectsByClient(activeProjects);
  
    renderProjectGroups(projectsContainer, projectsByClient, false);
  }

  // Render Completed Projects
  function renderCompletedProjects(filteredProjects = null) {
    const completedProjectsContainer = document.getElementById('completed-projects-container');
    completedProjectsContainer.innerHTML = '';

    const layoutStyle = document.getElementById('layout-select').value || 'grid';
    if (layoutStyle === 'list') {
      completedProjectsContainer.classList.add('list-view');
    } else {
      completedProjectsContainer.classList.remove('list-view');
    }

    const projectsToRender = filteredProjects || projects;
    const completedProjects = projectsToRender.filter((p) => p.status === 'Completed');
    const projectsByClient = groupProjectsByClient(completedProjects);

    renderProjectGroups(completedProjectsContainer, projectsByClient, false);
  }

  // Render Admin Projects
  function renderAdminProjects(filteredProjects = null) {
    const adminProjectsContainer = document.getElementById('admin-projects');
    adminProjectsContainer.innerHTML = '';

    const layoutStyle = document.getElementById('layout-select').value || 'grid';
    if (layoutStyle === 'list') {
      adminProjectsContainer.classList.add('list-view');
    } else {
      adminProjectsContainer.classList.remove('list-view');
    }

    const projectsToRender = filteredProjects || projects.filter(p => p.status !== 'Completed');
    const projectsByClient = groupProjectsByClient(projectsToRender);

    renderProjectGroups(adminProjectsContainer, projectsByClient, true);
  }

  function groupProjectsByClient(projectsList) {
    const projectsByClient = {};
    projectsList.forEach((project) => {
      const clientId = project.clientId || 'No Client';
      if (!projectsByClient[clientId]) {
        projectsByClient[clientId] = [];
      }
      projectsByClient[clientId].push(project);
    });
    return projectsByClient;
  }

  function renderProjectGroups(container, projectsByClient, isAdminView) {
    for (const clientId in projectsByClient) {
      const clientProjects = projectsByClient[clientId];
      const client = clients.find((c) => c.id === clientId);
      const clientName = client ? client.name : 'No Client';

      const clientSection = document.createElement('div');
      clientSection.classList.add('client-section');

      const clientHeader = document.createElement('h3');
      clientHeader.textContent = clientName;
      clientSection.appendChild(clientHeader);

      clientProjects.forEach((project) => {
        const projectCard = createProjectCard(project, isAdminView);
        clientSection.appendChild(projectCard);
      });

      container.appendChild(clientSection);
    }
  }

  function createProjectCard(project, isAdminView) {
    const projectCard = document.createElement('div');
    projectCard.classList.add('project-card');
    projectCard.setAttribute('data-project-id', project.id);
  
    if (project.status === 'Completed') {
      projectCard.classList.add('completed');
    }
  
    let timersHTML = '';
    if (project.activeOperations) {
      timersHTML = '<div class="employee-timers">';
      for (const [employeeId, timerData] of Object.entries(project.activeOperations)) {
        const employee = employees.find((e) => e.id === employeeId);
        const employeeName = employee ? employee.name : 'Unknown';
        const isPaused = timerData.isPaused;
        timersHTML += `
          <div class="employee-timer" data-employee-id="${employeeId}">
            <span class="timer-display">${employeeName}: ${timerData.operation}</span>
            <button class="pause-resume-btn btn-secondary ${isPaused ? 'paused' : ''}" data-employee-id="${employeeId}">${isPaused ? 'Resume' : 'Pause'}</button>
            <button class="stop-employee-btn btn-secondary" data-employee-id="${employeeId}">Stop</button>
          </div>`;
      }
      timersHTML += '</div>';
    }

    const client = clients.find((c) => c.id === project.clientId);
    const clientName = client ? client.name : 'No Client Assigned';

    const assignedEmployeeNames = (project.assignedEmployees || [])
      .map((employeeId) => {
        const employee = employees.find((e) => e.id === employeeId);
        return employee ? employee.name : 'Unknown';
      })
      .join(', ');

    const estimatedTimeMs = isNaN(project.estimatedTime) ? 0 : project.estimatedTime * 3600000;
    const manualTimeHtml = project.manualTime > 0 ? `<p><strong>Manual Time:</strong> ${formatDuration(project.manualTime * 3600000)}</p>` : '';

    projectCard.innerHTML = `
    <div class="project-header">
      <h3>${project.name}</h3>
      <div class="project-timer">
        <p><strong>Estimated Time:</strong> ${formatDuration(estimatedTimeMs)}</p>
        ${manualTimeHtml}
        <p><strong>Actual Time:</strong> ${formatDuration(project.actualTime * 3600000)}</p>
        ${timersHTML}
      </div>
    </div>
    <div class="project-details">
      <p><strong>Purchase Order:</strong> ${project.purchaseOrder || 'N/A'}</p>
      <p><strong>Part Number:</strong> ${project.partNumber || 'N/A'}</p>
      <p><strong>Job Number:</strong> ${project.jobNumber || 'N/A'}</p>
      <p><strong>Due Date:</strong> ${project.dueDate || 'N/A'}</p>
      <p><strong>Quantity:</strong> ${project.quantity || 'N/A'}</p>
      <p><strong>Notes:</strong> ${project.notes || 'N/A'}</p>
      <p><strong>Assigned Employees:</strong> ${assignedEmployeeNames || 'None'}</p>
      <p><strong>Priority:</strong> ${project.priority || 'N/A'}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Status:</strong> ${project.status || 'N/A'}</p>
    </div>
    <div class="action-buttons">
    ${project.status !== 'Completed' ? `<button class="start-employee-btn">Start Operation</button>` : ''}
    ${project.status !== 'Completed' && !isAdminView ? `<button class="complete-btn">Mark as Completed</button>` : ''}
    ${isAdminView ? `
      <button class="view-details-btn">View Details</button>
      <button class="print-btn">Print</button>
      ${project.status !== 'Completed' ? `<button class="edit-btn">Edit</button>` : ''}
      <button class="delete-btn">Delete</button>
    ` : ''}
    ${project.status === 'Completed' ? `<button class="delete-completed-btn btn-danger">Delete Completed Project</button>` : ''}
  </div>
`;

  // Event Listeners for Project Actions
  const startEmployeeBtn = projectCard.querySelector('.start-employee-btn');
  const viewDetailsBtn = projectCard.querySelector('.view-details-btn');
  const printBtn = projectCard.querySelector('.print-btn');
  const editBtn = projectCard.querySelector('.edit-btn');
  const deleteBtn = projectCard.querySelector('.delete-btn');
  const completeBtn = projectCard.querySelector('.complete-btn');
  const deleteCompletedBtn = projectCard.querySelector('.delete-completed-btn');

  if (startEmployeeBtn) {
    startEmployeeBtn.addEventListener('click', () => {
      showEmployeeOperationModal(project.id);
    });
  }

  projectCard.addEventListener('click', (event) => {
    if (event.target.classList.contains('stop-employee-btn')) {
      const employeeId = event.target.getAttribute('data-employee-id');
      stopEmployeeOperation(project.id, employeeId);
    } else if (event.target.classList.contains('pause-resume-btn')) {
      const employeeId = event.target.getAttribute('data-employee-id');
      pauseResumeEmployeeOperation(project.id, employeeId);
    }
  });

  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      showProjectDetails(project);
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printProjectDetails(project);
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editProject(project);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this project?')) {
        deleteProject(project.id);
      }
    });
  }

  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      completeProject(project);
    });
  }

  if (deleteCompletedBtn) {
    deleteCompletedBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this completed project?')) {
        deleteCompletedProject(project.id);
      }
    });
  }

  return projectCard;
}

// Start Employee Operation Timer
function startEmployeeOperation(projectId, employeeId, operation) {
  const project = projects.find((p) => p.id === projectId);
  const employee = employees.find((e) => e.id === employeeId);
  if (project && employee) {
    if (!project.activeOperations) {
      project.activeOperations = {};
    }
    if (!project.activeOperations[employeeId]) {
      const logEntry = {
        id: generateId(),
        projectId: project.id,
        projectName: project.name,
        operation,
        employeeId: employee.id,
        employeeName: employee.name,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        pausedTime: 0,
        pauseCount: 0,
        pauseLog: [],
      };
      push(ref(db, 'workLogs'), logEntry)
      .then((newLogRef) => {
        const newLogId = newLogRef.key;
        logEntry.id = newLogId;
        project.activeOperations[employeeId] = {
          logEntryId: newLogId,
          operation: operation,
          isPaused: false,
          pauseStartTime: null,
          startTime: Date.now(),
        };
    
        project.status = 'In Progress';
    
        update(ref(db, `projects/${project.id}`), project)
          .then(() => {
            renderProjects();
            renderAdminProjects();
            showNotification(`${employee.name} started ${operation} on ${project.name}`, 'success');
            updateTimerDisplay(projectId, employeeId);
          })
          .catch((error) => {
            console.error("Error updating project:", error);
            showNotification('Failed to start operation. Please try again.', 'error');
          });
      })
      .catch((error) => {
        console.error("Error adding work log:", error);
        showNotification('Failed to start operation. Please try again.', 'error');
      });
    }
  }
}

// PAUSE / RESUME 
function pauseResumeEmployeeOperation(projectId, employeeId) {
  console.log(`pauseResumeEmployeeOperation called for project ${projectId}, employee ${employeeId}`);
  const project = projects.find((p) => p.id === projectId);
  if (project && project.activeOperations && project.activeOperations[employeeId]) {
    const timer = project.activeOperations[employeeId];
    
    get(ref(db, `workLogs/${timer.logEntryId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const logEntry = snapshot.val();
        
        if (timer.isPaused) {
          // Resume
          const pauseDuration = Date.now() - timer.pauseStartTime;
          logEntry.pausedTime += pauseDuration;
          if (logEntry.pauseLog && logEntry.pauseLog.length > 0) {
            logEntry.pauseLog[logEntry.pauseLog.length - 1].endTime = Date.now();
            logEntry.pauseLog[logEntry.pauseLog.length - 1].duration = pauseDuration;
          }
          timer.isPaused = false;
          timer.pauseStartTime = null;
        } else {
          // Pause
          timer.isPaused = true;
          timer.pauseStartTime = Date.now();
          logEntry.pauseCount = (logEntry.pauseCount || 0) + 1;
          if (!Array.isArray(logEntry.pauseLog)) {
            logEntry.pauseLog = [];
          }
          logEntry.pauseLog.push({
            startTime: Date.now(),
            endTime: null,
            duration: 0
          });
        }

        Promise.all([
          update(ref(db, `projects/${project.id}/activeOperations/${employeeId}`), timer),
          update(ref(db, `workLogs/${timer.logEntryId}`), logEntry)
        ]).then(() => {
          // Update local state
          project.activeOperations[employeeId] = timer;

          // Update the pause/resume button
          const pauseResumeBtn = document.querySelector(
            `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .pause-resume-btn`
          );
          if (pauseResumeBtn) {
            pauseResumeBtn.textContent = timer.isPaused ? 'Resume' : 'Pause';
            pauseResumeBtn.classList.toggle('paused', timer.isPaused);
          }
          
          updateTimerDisplay(projectId, employeeId);
          showNotification(`${logEntry.employeeName} ${timer.isPaused ? 'paused' : 'resumed'} work on ${project.name}`, 'info');
        }).catch((error) => {
          console.error("Error updating pause state:", error);
          showNotification('Failed to update pause state. Please try again.', 'error');
        });
      }
    });
  }
}

function stopEmployeeOperation(projectId, employeeId) {
  console.log(`Stopping operation for project ${projectId}, employee ${employeeId}`);
  const project = projects.find((p) => p.id === projectId);
  if (project && project.activeOperations && project.activeOperations[employeeId]) {
    const timer = project.activeOperations[employeeId];

    get(ref(db, `workLogs/${timer.logEntryId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const logEntry = snapshot.val();
        logEntry.endTime = Date.now();
        if (timer.isPaused) {
          const finalPauseDuration = logEntry.endTime - timer.pauseStartTime;
          logEntry.pausedTime = (logEntry.pausedTime || 0) + finalPauseDuration;
          if (logEntry.pauseLog && logEntry.pauseLog.length > 0) {
            logEntry.pauseLog[logEntry.pauseLog.length - 1].endTime = logEntry.endTime;
            logEntry.pauseLog[logEntry.pauseLog.length - 1].duration = finalPauseDuration;
          }
        }
        logEntry.duration = logEntry.endTime - logEntry.startTime - (logEntry.pausedTime || 0);

        Promise.all([
          update(ref(db, `workLogs/${timer.logEntryId}`), logEntry),
          remove(ref(db, `projects/${projectId}/activeOperations/${employeeId}`))
        ]).then(() => {
          updateActualProjectTime(projectId);
          delete project.activeOperations[employeeId];

          if (Object.keys(project.activeOperations).length === 0) {
            remove(ref(db, `projects/${projectId}/activeOperations`)).then(() => {
              delete project.activeOperations;
              project.status = 'Not Started';
              update(ref(db, `projects/${projectId}`), { status: 'Not Started' }).then(() => {
                renderProjects();
                renderAdminProjects();
                showNotification(`Operation stopped for ${logEntry.employeeName}.`, 'info');
              });
            });
          } else {
            update(ref(db, `projects/${projectId}`), project).then(() => {
              renderProjects();
              renderAdminProjects();
              showNotification(`Operation stopped for ${logEntry.employeeName}.`, 'info');
            });
          }
        }).catch((error) => {
          console.error('Error stopping employee operation:', error);
          showNotification('Failed to stop operation. Please try again.', 'error');
        });
      }
    });
  }
}

function updateActualProjectTime(projectId) {
  get(ref(db, `projects/${projectId}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const project = snapshot.val();
      if (project.manualTime > 0) {
        update(ref(db, `projects/${projectId}`), { actualTime: project.manualTime });
      } else {
        get(ref(db, `workLogs`)).then((logsSnapshot) => {
          if (logsSnapshot.exists()) {
            const allLogs = logsSnapshot.val();
            const projectLogs = Object.values(allLogs).filter(log => log.projectId === projectId);
            const totalMinutes = projectLogs.reduce((total, log) => {
              const logDuration = log.duration || 0;
              return total + Math.floor(logDuration / 60000);
            }, 0);
            const actualHours = totalMinutes / 60;
            update(ref(db, `projects/${projectId}`), { actualTime: actualHours });
          }
        });
      }
    }
  });
}

// Helper Functions
function generateId() {
  return push(ref(db)).key;
}

function loadEmployeesToSelect(selectElement) {
  selectElement.innerHTML = '';
  employees.forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.name;
    selectElement.appendChild(option);
  });
}

function loadClientsToSelect(selectElement) {
  selectElement.innerHTML = '<option value="">Select Client</option>';
  clients.forEach((client) => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    selectElement.appendChild(option);
  });
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) {
    return '0h 0m 0s';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Edit Project
function editProject(project) {
  loadEmployeesToSelect(document.getElementById('project-employees'));
  loadClientsToSelect(document.getElementById('project-client'));

  document.getElementById('project-name').value = project.name;
  document.getElementById('purchase-order').value = project.purchaseOrder;
  document.getElementById('part-number').value = project.partNumber;
  document.getElementById('job-number').value = project.jobNumber;
  document.getElementById('due-date').value = project.dueDate;
  document.getElementById('quantity').value = project.quantity;
  document.getElementById('notes').value = project.notes;
  document.getElementById('project-priority').value = project.priority;
  document.getElementById('project-client').value = project.clientId || '';
  document.getElementById('estimated-time').value = project.estimatedTime || 0;
  document.getElementById('manual-time').value = project.manualTime || 0;

  const projectEmployeesSelect = document.getElementById('project-employees');
  Array.from(projectEmployeesSelect.options).forEach((option) => {
    option.selected = project.assignedEmployees?.includes(option.value) || false;
  });

  projectModal.style.display = 'block';

  saveProjectBtn.onclick = function () {
    project.name = document.getElementById('project-name').value;
    project.purchaseOrder = document.getElementById('purchase-order').value;
    project.partNumber = document.getElementById('part-number').value;
    project.jobNumber = document.getElementById('job-number').value;
    project.dueDate = document.getElementById('due-date').value;
    project.quantity = document.getElementById('quantity').value;
    project.notes = document.getElementById('notes').value;
    project.assignedEmployees = Array.from(projectEmployeesSelect.selectedOptions).map(
      (option) => option.value
    );
    project.priority = document.getElementById('project-priority').value;
    project.clientId = document.getElementById('project-client').value;
    project.estimatedTime = parseFloat(document.getElementById('estimated-time').value) || 0;
    project.manualTime = parseFloat(document.getElementById('manual-time').value) || 0;
    project.actualTime = project.manualTime > 0 ? project.manualTime : project.actualTime;

    update(ref(db, `projects/${project.id}`), project)
      .then(() => {
        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        projectModal.style.display = 'none';
        projectForm.reset();
        showNotification('Project updated successfully', 'success');
        saveProjectBtn.onclick = saveNewProject;
      })
      .catch((error) => {
        console.error('Error updating project:', error);
        showNotification('Failed to update project. Please try again.', 'error');
      });
    };
  }
  
  // Show Project Details
  function showProjectDetails(project) {
    const client = clients.find((c) => c.id === project.clientId);
    const clientName = client ? client.name : 'No Client Assigned';
  
    const assignedEmployeeNames = (project.assignedEmployees || [])
      .map((employeeId) => {
        const employee = employees.find((e) => e.id === employeeId);
        return employee ? employee.name : 'Unknown';
      })
      .join(', ');
  
    projectDetailsModal.style.display = 'block';
    projectDetailsContent.innerHTML = `
      <h2>Project Details: ${project.name}</h2>
      <p><strong>Purchase Order:</strong> ${project.purchaseOrder || 'N/A'}</p>
      <p><strong>Part Number:</strong> ${project.partNumber || 'N/A'}</p>
      <p><strong>Job Number:</strong> ${project.jobNumber || 'N/A'}</p>
      <p><strong>Due Date:</strong> ${project.dueDate || 'N/A'}</p>
      <p><strong>Quantity:</strong> ${project.quantity || 'N/A'}</p>
      <p><strong>Notes:</strong> ${project.notes || 'N/A'}</p>
      <p><strong>Assigned Employees:</strong> ${assignedEmployeeNames || 'None'}</p>
      <p><strong>Priority:</strong> ${project.priority || 'N/A'}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Status:</strong> ${project.status || 'N/A'}</p>
      <p><strong>Estimated Time:</strong> ${formatDuration(project.estimatedTime * 3600000)}</p>
      <p><strong>Manual Time:</strong> ${formatDuration(project.manualTime * 3600000)}</p>
      <p><strong>Actual Time:</strong> ${formatDuration(project.actualTime * 3600000)}</p>
    `;
  }
  
  // Close Project Details Modal
  closeProjectDetailsModalBtn.addEventListener('click', () => {
    projectDetailsModal.style.display = 'none';
  });
  
  // Print Project Details
  function printProjectDetails(project) {
    const client = clients.find((c) => c.id === project.clientId);
    const clientName = client ? client.name : 'No Client Assigned';
  
    const printWindow = window.open('', '_blank');
    const projectDetailsHTML = `
      <html>
      <head>
        <title>Job Traveler: ${project.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 16px; }
          h1 { color: #333; font-size: 28px; margin-bottom: 20px; }
          .job-traveler { border: 2px solid #000; padding: 30px; margin-bottom: 20px; }
          .job-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .job-info p { margin: 10px 0; font-size: 18px; }
          .notes { margin-top: 20px; }
          .notes h2 { font-size: 22px; }
          .notes p { font-size: 18px; line-height: 1.5; }
          .print-buttons { margin-bottom: 20px; }
          .print-button, .close-button {
            padding: 10px 20px;
            font-size: 16px;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          }
          .print-button { background-color: #4CAF50; }
          .close-button { background-color: #f44336; }
          @media print {
            .print-buttons { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-buttons">
          <button onclick="window.print()" class="print-button">Print</button>
          <button onclick="window.close()" class="close-button">Close</button>
        </div>
        <div class="job-traveler">
          <h1>Job Traveler: ${project.name}</h1>
          <div class="job-info">
            <p><strong>Purchase Order:</strong> ${project.purchaseOrder || 'N/A'}</p>
            <p><strong>Part Number:</strong> ${project.partNumber || 'N/A'}</p>
            <p><strong>Job Number:</strong> ${project.jobNumber || 'N/A'}</p>
            <p><strong>Due Date:</strong> ${project.dueDate || 'N/A'}</p>
            <p><strong>Quantity:</strong> ${project.quantity || 'N/A'}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Priority:</strong> ${project.priority || 'N/A'}</p>
            <p><strong>Status:</strong> ${project.status || 'N/A'}</p>
            <p><strong>Estimated Time:</strong> ${formatDuration(project.estimatedTime * 3600000)}</p>
            <p><strong>Manual Time:</strong> ${formatDuration(project.manualTime * 3600000)}</p>
            <p><strong>Actual Time:</strong> ${formatDuration(project.actualTime * 3600000)}</p>
          </div>
          <div class="notes">
            <h2>Notes:</h2>
            <p>${project.notes || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(projectDetailsHTML);
    printWindow.document.close();
  }
  
  // Complete Project
  function completeProject(project) {
    calculateTotalProjectTime(project.id).then(({ operationTimes, totalTimeHours }) => {
      const completedProject = {
        ...project,
        status: 'Completed',
        completedAt: Date.now(),
        operationTimes: operationTimes,
        totalTimeHours: totalTimeHours,
        actualTime: parseFloat(totalTimeHours)
      };
  
      update(ref(db, `projects/${project.id}`), completedProject)
        .then(() => {
          // Add a work log entry for the completed project
          const completionLog = {
            id: generateId(),
            projectId: project.id,
            projectName: project.name,
            operation: 'Project Completion',
            completedAt: Date.now(),
            operationTimes: operationTimes,
            totalTimeHours: totalTimeHours
          };
  
          push(ref(db, 'workLogs'), completionLog)
            .then(() => {
              renderProjects();
              renderCompletedProjects();
              renderAdminProjects();
              renderWorkLogs();
              showNotification(`Project "${project.name}" marked as Completed.`, 'success');
            })
            .catch(error => {
              console.error('Error logging project completion:', error);
              showNotification('Failed to log project completion. Please try again.', 'error');
            });
        })
        .catch(error => {
          console.error('Error completing project:', error);
          showNotification('Failed to complete the project. Please try again.', 'error');
        });
    });
  }
  
  // Calculate total time for a project
  function calculateTotalProjectTime(projectId) {
    return get(ref(db, `workLogs`)).then((snapshot) => {
      if (snapshot.exists()) {
        const allLogs = snapshot.val();
        const projectLogs = Object.values(allLogs).filter(log => log.projectId === projectId);
        
        // Group logs by operation
        const operationTimes = {};
        let totalTime = 0;
  
        projectLogs.forEach(log => {
          const duration = log.duration || 0;
          if (!operationTimes[log.operation]) {
            operationTimes[log.operation] = 0;
          }
          operationTimes[log.operation] += duration;
          totalTime += duration;
        });
  
        // Convert milliseconds to hours
        Object.keys(operationTimes).forEach(operation => {
          operationTimes[operation] = (operationTimes[operation] / 3600000).toFixed(2);
        });
  
        const totalTimeHours = (totalTime / 3600000).toFixed(2);
  
        return { operationTimes, totalTimeHours };
      }
      return { operationTimes: {}, totalTimeHours: 0 };
    });
  }
  
  // Delete Project
  function deleteProject(projectId) {
    remove(ref(db, `projects/${projectId}`))
      .then(() => {
        projects = projects.filter(p => p.id !== projectId);
        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        showNotification('Project deleted successfully', 'success');
      })
      .catch(error => {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete the project. Please try again.', 'error');
      });
  }
  
  // Delete Completed Project
  function deleteCompletedProject(projectId) {
    remove(ref(db, `projects/${projectId}`))
      .then(() => {
        projects = projects.filter(p => p.id !== projectId);
        renderCompletedProjects();
        showNotification('Completed project deleted successfully', 'success');
      })
      .catch(error => {
        console.error('Error deleting completed project:', error);
        showNotification('Failed to delete the completed project. Please try again.', 'error');
      });
  }
  
  // Search functionality
  document.getElementById('project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'), activeFilter);
    renderProjects(filteredProjects);
  });
  
  document.getElementById('completed-project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status === 'Completed'), 'all');
    renderCompletedProjects(filteredProjects);
  });
  
  document.getElementById('admin-project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'), activeFilter);
    renderAdminProjects(filteredProjects);
  });
  
  // Improved search function
  function searchProjects(searchTerm, projectList, filter = 'all') {
    searchTerm = searchTerm.toLowerCase().trim();
    return projectList.filter(p => {
      const matchesSearch = (
        p.name.toLowerCase().includes(searchTerm) ||
        (p.purchaseOrder && p.purchaseOrder.toLowerCase().includes(searchTerm)) ||
        (p.partNumber && p.partNumber.toLowerCase().includes(searchTerm)) ||
        (p.jobNumber && p.jobNumber.toLowerCase().includes(searchTerm)) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm)) ||
        p.status.toLowerCase().includes(searchTerm) ||
        (clients.find(c => c.id === p.clientId)?.name || '').toLowerCase().includes(searchTerm) ||
        p.assignedEmployees.some(empId => 
          employees.find(e => e.id === empId)?.name.toLowerCase().includes(searchTerm)
        )
      );
  
      const matchesFilter = (
        filter === 'all' ||
        (filter === 'in-progress' && p.status === 'In Progress') ||
        (filter === 'not-started' && p.status === 'Not Started') ||
        (filter === 'high-priority' && p.priority === 'high')
      );
  
      return matchesSearch && matchesFilter;
    });
  }
  
  // Add event listeners for the filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const searchTerm = document.getElementById('project-search-input').value;
      const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'), filter);
      renderProjects(filteredProjects);
    });
  });
  
  function setupImprovedSearch() {
    const searchInputs = [
      document.getElementById('project-search-input'),
      document.getElementById('completed-project-search-input'),
      document.getElementById('admin-project-search-input')
    ];
  
    searchInputs.forEach(searchInput => {
      const recentSearches = JSON.parse(localStorage.getItem(`recentSearches_${searchInput.id}`)) || [];
  
      function addToRecentSearches(term) {
        if (!recentSearches.includes(term)) {
          recentSearches.unshift(term);
          if (recentSearches.length > 5) recentSearches.pop();
          localStorage.setItem(`recentSearches_${searchInput.id}`, JSON.stringify(recentSearches));
        }
      }
  
      function getSearchSuggestions() {
        return [...new Set([
          ...recentSearches,
          ...projects.map(p => p.name),
          ...projects.map(p => p.purchaseOrder),
          ...projects.map(p => p.partNumber),
          ...projects.map(p => p.jobNumber),
          ...clients.map(c => c.name),
          ...employees.map(e => e.name),
          ...projects.map(p => p.dueDate)
        ])];
      }
  
      const datalist = document.createElement('datalist');
      datalist.id = `${searchInput.id}-suggestions`;
      searchInput.setAttribute('list', datalist.id);
      searchInput.parentNode.insertBefore(datalist, searchInput.nextSibling);
  
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        datalist.innerHTML = '';
        const suggestions = getSearchSuggestions().filter(item => 
          item && item.toLowerCase().includes(searchTerm)
        );
        suggestions.forEach(suggestion => {
          const option = document.createElement('option');
          option.value = suggestion;
          datalist.appendChild(option);
        });
      });
  
      searchInput.addEventListener('change', (e) => {
        addToRecentSearches(e.target.value);
      });
    });
  }
  
  function startActiveTimers() {
    projects.forEach(project => {
      if (project.activeOperations) {
        Object.entries(project.activeOperations).forEach(([employeeId, timer]) => {
          updateTimerDisplay(project.id, employeeId);
        });
      }
    });
  }
  
  function updateTimerDisplay(projectId, employeeId) {
    const timerDisplay = document.querySelector(
      `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .timer-display`
    );
    if (timerDisplay) {
      const project = projects.find(p => p.id === projectId);
      const timer = project.activeOperations[employeeId];
      const employee = employees.find(e => e.id === employeeId);
      const employeeName = employee ? employee.name : 'Unknown';
      
      const currentTime = Date.now();
      let elapsedTime = currentTime - timer.startTime;
      if (timer.isPaused) {
        elapsedTime = timer.pauseStartTime - timer.startTime;
      }
      
      timerDisplay.textContent = `${employeeName} (${timer.operation}): ${formatDuration(elapsedTime)}`;
    }
  }
  
  // Render Work Logs
  function renderWorkLogs() {
    const workLogEntries = document.getElementById('work-log-entries');
    workLogEntries.innerHTML = '';
  
    // Group logs by project
    const logsByProject = {};
    workLogs.forEach(log => {
      if (!logsByProject[log.projectId]) {
        logsByProject[log.projectId] = [];
      }
      logsByProject[log.projectId].push(log);
    });
  
    // Render logs grouped by project
    for (const projectId in logsByProject) {
      const projectLogs = logsByProject[projectId];
      const projectName = projectLogs[0].projectName;
  
      const projectSection = document.createElement('div');
      projectSection.classList.add('project-log-section');
      
      const projectHeader = document.createElement('h3');
      projectHeader.textContent = projectName;
      projectSection.appendChild(projectHeader);
  
      const logTable = document.createElement('table');
      logTable.classList.add('work-log-table');
      logTable.innerHTML = `
        <thead>
          <tr>
            <th>Operation</th>
            <th>Employee</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Duration</th>
            <th>Pause Count</th>
            <th>Total Pause Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
  
      projectLogs.forEach((log) => {
        const row = document.createElement('tr');
        if (log.operation === 'Project Completion') {
          // Special rendering for completed projects
          row.innerHTML = `
            <td colspan="8">
              <strong>Project Completed</strong><br>
              Completed At: ${new Date(log.completedAt).toLocaleString()}<br>
              Total Time: ${log.totalTimeHours} hours<br>
              Operation Times:<br>
              ${Object.entries(log.operationTimes).map(([op, time]) => `${op}: ${time} hours`).join('<br>')}
            </td>
          `;
        } else {
          // Regular log entry rendering
          row.innerHTML = `
            <td>${log.operation}</td>
            <td>${log.employeeName}</td>
            <td>${new Date(log.startTime).toLocaleString()}</td>
            <td>${log.endTime ? new Date(log.endTime).toLocaleString() : 'In Progress'}</td>
            <td>${formatDuration(log.duration)}</td>
            <td>${log.pauseCount}</td>
            <td>${formatDuration(log.pausedTime)}</td>
            <td>
              <button class="view-pause-log-btn btn-secondary">View Pause Log</button>
              <button class="edit-log-btn btn-secondary">Edit</button>
              <button class="delete-log-btn btn-danger">Delete</button>
            </td>
          `;
  
          const viewPauseLogBtn = row.querySelector('.view-pause-log-btn');
          viewPauseLogBtn.addEventListener('click', () => {
            showPauseLogModal(log);
          });
  
          const editLogBtn = row.querySelector('.edit-log-btn');
          editLogBtn.addEventListener('click', () => {
            editWorkLog(log);
          });
  
          const deleteLogBtn = row.querySelector('.delete-log-btn');
          deleteLogBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this log entry?')) {
              deleteWorkLog(log.id);
            }
          });
        }
  
        logTable.querySelector('tbody').appendChild(row);
      });
  
      projectSection.appendChild(logTable);
      workLogEntries.appendChild(projectSection);
    }
  }
  
  function showPauseLogModal(log) {
    const modal = document.getElementById('pause-log-modal');
    const modalContent = document.getElementById('pause-log-content');
    modalContent.innerHTML = `
      <h2>Pause Log for ${log.employeeName} - ${log.operation}</h2>
      <table>
        <thead>
          <tr>
            <th>Pause Start</th>
            <th>Pause End</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${log.pauseLog.map(pause => `
            <tr>
              <td>${new Date(pause.startTime).toLocaleString()}</td>
              <td>${pause.endTime ? new Date(pause.endTime).toLocaleString() : 'N/A'}</td>
              <td>${formatDuration(pause.duration)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    modal.style.display = 'block';
  
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    }
  
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    }
  }
  
  // Edit Work Log
  function editWorkLog(log) {
    editLogModal.style.display = 'block';
    editLogContent.innerHTML = `
      <h2>Edit Work Log</h2>
      <form id="edit-log-form">
        <label for="edit-log-operation">Operation:</label>
        <input type="text" id="edit-log-operation" value="${log.operation}" required>
        <label for="edit-log-employee">Employee:</label>
        <input type="text" id="edit-log-employee" value="${log.employeeName}" required>
        <label for="edit-log-start-time">Start Time:</label>
        <input type="datetime-local" id="edit-log-start-time" value="${new Date(log.startTime).toISOString().slice(0, 16)}" required>
        <label for="edit-log-end-time">End Time:</label>
        <input type="datetime-local" id="edit-log-end-time" value="${log.endTime ? new Date(log.endTime).toISOString().slice(0, 16) : ''}" ${log.endTime ? 'required' : ''}>
        <button type="submit" class="btn-primary">Save Changes</button>
      </form>
    `;
  
    const editLogForm = document.getElementById('edit-log-form');
    editLogForm.onsubmit = function(e) {
      e.preventDefault();
      const updatedLog = {
        ...log,
        operation: document.getElementById('edit-log-operation').value,
        employeeName: document.getElementById('edit-log-employee').value,
        startTime: new Date(document.getElementById('edit-log-start-time').value).getTime(),
        endTime: document.getElementById('edit-log-end-time').value ? new Date(document.getElementById('edit-log-end-time').value).getTime() : null
      };
      updatedLog.duration = updatedLog.endTime ? updatedLog.endTime - updatedLog.startTime : 0;
  
      update(ref(db, `workLogs/${log.id}`), updatedLog)
        .then(() => {
          editLogModal.style.display = 'none';
          loadData(); // Reload all data to ensure consistency
          showNotification('Work log updated successfully', 'success');
        })
        .catch((error) => {
          console.error('Error updating work log:', error);
          showNotification('Failed to update work log. Please try again.', 'error');
        });
    };
  }
  
  // Delete Work Log Entry
  function deleteWorkLog(logId) {
    const workLogRef = ref(db, `workLogs/${logId}`);
    
    remove(workLogRef)
      .then(() => {
        console.log(`Work log with id ${logId} successfully deleted from Firebase`);
        loadData(); // Reload all data to ensure consistency
        showNotification('Work log entry deleted successfully', 'success');
      })
      .catch((error) => {
        console.error("Error deleting work log:", error);
        showNotification('Failed to delete work log. Please try again.', 'error');
      });
  }
  
  // Clear All Data
  function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      set(ref(db), null)
        .then(() => {
          console.log('All data cleared successfully');
          projects = [];
          employees = [];
          operations = [];
          workLogs = [];
          clients = [];
          renderProjects();
          renderCompletedProjects();
          renderAdminProjects();
          renderEmployees();
          renderWorkLogs();
          renderClients();
          renderOperations();
          showNotification('All data has been cleared successfully', 'success');
        })
        .catch((error) => {
          console.error('Error clearing data:', error);
          showNotification('Failed to clear data. Please try again.', 'error');
        });
    }
  }
  
  // Add event listener to the clear data button
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
  
  // Export Data
  function exportData() {
    const data = {
      projects,
      employees,
      operations,
      workLogs,
      clients
    };
  
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
    const exportFileDefaultName = 'project_management_data.json';
  
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Data exported successfully', 'success');
  }
  
  // Add event listener to the export data button
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  function backupLocalData() {
    const dataToBackup = {
      projects,
      employees,
      operations,
      workLogs,
      clients
    };
    localStorage.setItem('projectManagementBackup', JSON.stringify(dataToBackup));
  }
  
  // Call this function periodically
  setInterval(backupLocalData, 300000); // Every 5 minutes
  
  function recoverFromLocalBackup() {
    const backupData = localStorage.getItem('projectManagementBackup');
    if (backupData) {
      const parsedData = JSON.parse(backupData);
      projects = parsedData.projects;
      employees = parsedData.employees;
      operations = parsedData.operations;
      workLogs = parsedData.workLogs;
      clients = parsedData.clients;
      renderAll();
      showNotification('Data recovered from local backup', 'info');
    } else {
      showNotification('No local backup found', 'warning');
    }
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.innerHTML = `
      <span>${message}</span>
      <button class="close-notification">&times;</button>
    `;
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
  
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  function validateProjectData(projectData) {
    if (!projectData.name || projectData.name.trim() === '') {
      throw new Error('Project name is required');
    }
    if (projectData.estimatedTime < 0) {
      throw new Error('Estimated time cannot be negative');
    }
    if (projectData.manualTime < 0) {
      throw new Error('Manual time cannot be negative');
    }
    // Add more validations as needed
  }
  
  // Handle offline/online events
  window.addEventListener('online', () => {
    showNotification('You are back online. Syncing data...', 'info');
    loadData().then(() => {
      showNotification('Data synced successfully', 'success');
    });
  });
  
  window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may be limited.', 'warning');
  });
  
  // Implement periodic data sync (every 5 minutes)
  setInterval(() => {
    if (navigator.onLine) {
      loadData().then(() => {
        console.log('Data synced successfully');
      });
    }
  }, 300000); // 5 minutes in milliseconds
  
  // Auto-save function
  function autoSave() {
    const dataToSave = {
      projects,
      employees,
      operations,
      workLogs,
      clients
    };
  
    set(ref(db), dataToSave)
      .then(() => {
        console.log('Auto-save successful');
      })
      .catch((error) => {
        console.error('Auto-save failed:', error);
      });
  }
  
  // Call autoSave every 5 minutes
  setInterval(autoSave, 300000);
  
  // Also call autoSave when the user is about to leave the page
  window.addEventListener('beforeunload', autoSave);
  
  // Initial renders
  renderProjects();
  renderCompletedProjects();
  renderAdminProjects();
  renderEmployees();
  renderWorkLogs();
  renderClients();
  renderOperations();
  
  // Add Operation function
  function addOperation() {
    const operationName = document.getElementById('new-operation-input').value.trim();
    if (operationName) {
      if (!Array.isArray(operations)) {
        operations = [];
      }
      operations.push(operationName);
      set(ref(db, 'operations'), operations)
        .then(() => {
          renderOperations();
          document.getElementById('new-operation-input').value = '';
          showNotification('Operation added successfully', 'success');
        })
        .catch((error) => {
          console.error("Error adding operation:", error);
          showNotification('Failed to add operation. Please try again.', 'error');
        });
    } else {
      showNotification('Please enter a valid operation name.', 'warning');
    }
  }
  
  // Render Employees
  function renderEmployees() {
    const employeesContainer = document.getElementById('employees');
    if (employeesContainer) {
      employeesContainer.innerHTML = '';
      employees.forEach((employee) => {
        const li = document.createElement('li');
        li.textContent = employee.name;
        employeesContainer.appendChild(li);
      });
    }
  }
  
  // Render Operations
  function renderOperations() {
    const operationsList = document.getElementById('operations-list');
    if (operationsList) {
      operationsList.innerHTML = '';
      operations.forEach((operation, index) => {
        const li = document.createElement('li');
        li.textContent = operation;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn-danger');
        deleteBtn.addEventListener('click', () => deleteOperation(index));
        li.appendChild(deleteBtn);
        operationsList.appendChild(li);
    });
  }
}

// Delete Operation
function deleteOperation(index) {
  operations.splice(index, 1);
  set(ref(db, 'operations'), operations)
    .then(() => {
      renderOperations();
      showNotification('Operation deleted successfully', 'success');
    })
    .catch((error) => {
      console.error("Error deleting operation:", error);
      showNotification('Failed to delete operation. Please try again.', 'error');
    });
}

// Add event listener for adding operations
const addOperationBtn = document.getElementById('add-operation-btn');
if (addOperationBtn) {
  addOperationBtn.addEventListener('click', addOperation);
} else {
  console.error('Add operation button not found');
}

// Function to render all data
function renderAll() {
  renderProjects();
  renderCompletedProjects();
  renderAdminProjects();
  renderEmployees();
  renderWorkLogs();
  renderClients();
  renderOperations();
}

// Initialize the application
function initApp() {
  loadData().then(() => {
    setupImprovedSearch();
    startActiveTimers();
    showSection('project-list'); // Initially show the project list
  }).catch(error => {
    console.error("Error initializing app:", error);
    showNotification('Failed to initialize the application. Please refresh the page and try again.', 'error');
  });
}

// Call initApp when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

}); // End of DOMContentLoaded event listener
