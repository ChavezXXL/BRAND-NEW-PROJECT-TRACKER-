// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, push, remove, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
  console.log('DOM fully loaded and parsed');

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
      projects = projectsSnapshot.exists() ? Object.values(projectsSnapshot.val()) : [];
      employees = employeesSnapshot.exists() ? Object.values(employeesSnapshot.val()) : [];
      operations = operationsSnapshot.exists() ? Object.values(operationsSnapshot.val()) : [];
      workLogs = workLogsSnapshot.exists() ? Object.values(workLogsSnapshot.val()) : [];
      clients = clientsSnapshot.exists() ? Object.values(clientsSnapshot.val()) : [];
  
      console.log('Data loaded:', { projects, employees, operations, workLogs, clients });
  
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
    }).catch(error => {
      console.error("Error loading data:", error);
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

    set(ref(db, 'settings'), settings);

    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    document.documentElement.style.setProperty('--font-family', settings.fontFamily);

    renderProjects();
    renderCompletedProjects();
    renderAdminProjects();
  }

  // Initial data load
  loadData();

  // Apply initial font family
  document.documentElement.style.setProperty(
    '--font-family',
    'Poppins, sans-serif'
  );

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
    console.log('Menu icon clicked');
    sideMenu.classList.toggle('active');
    console.log('Side menu classes:', sideMenu.classList);
  });

  // Close Side Menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!sideMenu.contains(event.target) && !menuIcon.contains(event.target)) {
      sideMenu.classList.remove('active');
    }
  });

  // Show and Hide Content Sections
  function showSection(sectionId) {
    console.log('Showing section:', sectionId);
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

  // Add Project Modal
  addProjectBtn.addEventListener('click', () => {
    console.log('Add project button clicked');
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
    console.log('Project modal display:', projectModal.style.display);
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
    };

    set(ref(db, `projects/${projectData.id}`), projectData)
      .then(() => {
        projects.push(projectData);
        renderProjects();
        renderAdminProjects();
        projectModal.style.display = 'none';
        projectForm.reset();
        console.log('Project saved successfully');
      })
      .catch((error) => {
        console.error('Error saving project:', error);
      });
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
      set(ref(db, `employees/${newEmployee.id}`), newEmployee);
      employees.push(newEmployee);
      renderEmployees();
      employeeModal.style.display = 'none';
      employeeForm.reset();
    } else {
      alert('Please enter a valid employee name.');
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
      alert('Please select an operation and at least one employee.');
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
    operations.forEach((op) => {
      const option = document.createElement('option');
      option.value = op;
      option.textContent = op;
      operationSelect.appendChild(option);
    });
  }

  function loadAssignedEmployeesToOperationSelect(assignedEmployeeIds = []) {
    const operationEmployeesSelect = document.getElementById('operation-employees');
    operationEmployeesSelect.innerHTML = '';

     // Ensure IDs are strings for comparison
    assignedEmployeeIds = assignedEmployeeIds.map(String);

    if (assignedEmployeeIds.length === 0) {
      // If no employees are assigned, load all employees
      employees.forEach((employee) => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        operationEmployeesSelect.appendChild(option);
      });
    } else {
      employees.forEach((employee) => {
        if (assignedEmployeeIds.includes(employee.id)) {
          const option = document.createElement('option');
          option.value = employee.id;
          option.textContent = employee.name;
          operationEmployeesSelect.appendChild(option);
        }
      });
    }

    // If still no options, add a default option
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
      set(ref(db, `clients/${newClient.id}`), newClient);
      clients.push(newClient);
      renderClients();
      clientModal.style.display = 'none';
      clientForm.reset();
    } else {
      alert('Please enter a valid client name.');
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
      })
      .catch((error) => {
        console.error('Error updating client:', error);
      });
  }

  function deleteClient(clientId) {
    remove(ref(db, `clients/${clientId}`))
      .then(() => {
        console.log('Client deleted successfully');
        loadData(); // Reload data to reflect changes
      })
      .catch((error) => {
        console.error('Error deleting client:', error);
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
        const duration = Date.now() - timerData.logEntry.startTime - timerData.logEntry.pausedTime;
        const isPaused = timerData.isPaused;
        timersHTML += `<div class="employee-timer" data-employee-id="${employeeId}">
          <span class="timer-display">${employeeName}: ${formatDuration(duration)}</span>
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

    projectCard.innerHTML = `
      <h3>${project.name}</h3>
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
        ${timersHTML}
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
      </div>
    `;
     // Event Listeners for Project Actions
     const startEmployeeBtn = projectCard.querySelector('.start-employee-btn');
     const viewDetailsBtn = projectCard.querySelector('.view-details-btn');
     const printBtn = projectCard.querySelector('.print-btn');
     const editBtn = projectCard.querySelector('.edit-btn');
     const deleteBtn = projectCard.querySelector('.delete-btn');
     const completeBtn = projectCard.querySelector('.complete-btn');
 
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
           if (project.activeOperations) {
             for (const employeeId of Object.keys(project.activeOperations)) {
               stopEmployeeOperation(project.id, employeeId);
             }
           }
           remove(ref(db, `projects/${project.id}`));
           projects = projects.filter((p) => p.id !== project.id);
           renderProjects();
           renderCompletedProjects();
           renderAdminProjects();
         }
       });
     }
 
     if (completeBtn) {
       completeBtn.addEventListener('click', () => {
         completeProject(project);
       });
     }
 
     return projectCard;
   }

   // Event listener for the start operation button
  document.getElementById('start-operation-btn').addEventListener('click', () => {
    const projectId = document.getElementById('operation-modal').getAttribute('data-project-id');
    const operation = document.getElementById('operation-select').value;
    const selectedEmployeeIds = Array.from(document.getElementById('operation-employees').selectedOptions).map(
      (option) => option.value
    );
    if (operation && selectedEmployeeIds.length > 0) {
      selectedEmployeeIds.forEach((employeeId) => {
        startEmployeeOperation(projectId, employeeId, operation);
      });
      document.getElementById('operation-modal').style.display = 'none';
      document.getElementById('operation-form').reset();
    } else {
      alert('Please select an operation and at least one employee.');
    }
  });
 
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
          .then(() => {
            workLogs.push(logEntry);
            project.activeOperations[employeeId] = {
              intervalId: null,
              logEntry: logEntry,
              isPaused: false,
              pauseStartTime: null,
            };
      
            project.status = 'In Progress';
      
            update(ref(db, `projects/${project.id}`), project)
              .then(() => {
                renderProjects();
                renderAdminProjects();
          
                project.activeOperations[employeeId].intervalId = setInterval(() => {
                  const now = Date.now();
                  if (!project.activeOperations[employeeId].isPaused) {
                    logEntry.duration = now - logEntry.startTime - logEntry.pausedTime;
                    update(ref(db, `workLogs/${logEntry.id}`), { duration: logEntry.duration });
                    updateEmployeeTimerDisplay(projectId, employeeId, logEntry.duration, operation);
                  }
                }, 1000);
          
                showNotification(`${employee.name} started ${operation} on ${project.name}`);
              })
              .catch((error) => {
                console.error("Error updating project:", error);
                alert("Failed to start operation. Please try again.");
              });
          })
          .catch((error) => {
            console.error("Error adding work log:", error);
            alert("Failed to start operation. Please try again.");
          });
      }
    }
  }

  // PAUSE / RESUME 
  function pauseResumeEmployeeOperation(projectId, employeeId) {
    const project = projects.find((p) => p.id === projectId);
    if (project && project.activeOperations && project.activeOperations[employeeId]) {
      const timer = project.activeOperations[employeeId];
      
      if (timer.isPaused) {
        // Resume
        const pauseDuration = Date.now() - timer.pauseStartTime;
        timer.logEntry.pausedTime += pauseDuration;
        timer.logEntry.pauseLog[timer.logEntry.pauseLog.length - 1].endTime = Date.now();
        timer.logEntry.pauseLog[timer.logEntry.pauseLog.length - 1].duration = pauseDuration;
        timer.isPaused = false;
        timer.pauseStartTime = null;
        showNotification(`${timer.logEntry.employeeName} resumed work on ${project.name}`);
      } else {
        // Pause
        timer.isPaused = true;
        timer.pauseStartTime = Date.now();
        timer.logEntry.pauseCount++;
        timer.logEntry.pauseLog.push({
          startTime: Date.now(),
          endTime: null,
          duration: 0
        });
        showNotification(`${timer.logEntry.employeeName} paused work on ${project.name}`);
      }

      update(ref(db, `projects/${project.id}/activeOperations/${employeeId}`), timer);
      update(ref(db, `workLogs/${timer.logEntry.id}`), timer.logEntry);
      renderProjects();
      renderAdminProjects();
    }
  }

  function updateEmployeeTimerDisplay(projectId, employeeId, duration, operation) {
    const timerDisplay = document.querySelector(
      `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .timer-display`
    );
    const pauseResumeBtn = document.querySelector(
      `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .pause-resume-btn`
    );
    if (timerDisplay && pauseResumeBtn) {
      const project = projects.find((p) => p.id === projectId);
      const timer = project.activeOperations[employeeId];
      const employee = employees.find((e) => e.id === employeeId);
      const employeeName = employee ? employee.name : 'Unknown';
      timerDisplay.textContent = `${employeeName} (${operation}): ${formatDuration(duration)}`;
      pauseResumeBtn.textContent = timer.isPaused ? 'Resume' : 'Pause';
      pauseResumeBtn.classList.toggle('paused', timer.isPaused);
    }
  }

  function stopEmployeeOperation(projectId, employeeId) {
    const project = projects.find((p) => p.id === projectId);
    if (project && project.activeOperations && project.activeOperations[employeeId]) {
      const stopButton = document.querySelector(`.stop-employee-btn[data-employee-id="${employeeId}"]`);
      if (stopButton) {
        stopButton.disabled = true;
      }

      const timer = project.activeOperations[employeeId];
      clearInterval(timer.intervalId);
      timer.logEntry.endTime = Date.now();
      if (timer.isPaused) {
        const finalPauseDuration = timer.logEntry.endTime - timer.pauseStartTime;
        timer.logEntry.pausedTime += finalPauseDuration;
        timer.logEntry.pauseLog[timer.logEntry.pauseLog.length - 1].endTime = timer.logEntry.endTime;
        timer.logEntry.pauseLog[timer.logEntry.pauseLog.length - 1].duration = finalPauseDuration;
      }
      timer.logEntry.duration = timer.logEntry.endTime - timer.logEntry.startTime - timer.logEntry.pausedTime;

      update(ref(db, `workLogs/${timer.logEntry.id}`), timer.logEntry);
      remove(ref(db, `projects/${projectId}/activeOperations/${employeeId}`));
      delete project.activeOperations[employeeId];

      if (Object.keys(project.activeOperations).length === 0) {
        remove(ref(db, `projects/${projectId}/activeOperations`));
        delete project.activeOperations;
        project.status = 'Not Started';
        update(ref(db, `projects/${projectId}`), { status: 'Not Started' });
      }

      renderProjects();
      renderAdminProjects();
      renderWorkLogs();

      const timerDisplay = document.querySelector(
        `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .timer-display`
      );
      if (timerDisplay) {
        timerDisplay.textContent = 'Stopped';
      }

      setTimeout(() => {
        const timerElement = document.querySelector(
          `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"]`
        );
        if (timerElement) {
          timerElement.remove();
        }
      }, 500);
    }
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

      update(ref(db, `projects/${project.id}`), project);
      renderProjects();
      renderCompletedProjects();
      renderAdminProjects();
      projectModal.style.display = 'none';
      projectForm.reset();

      saveProjectBtn.onclick = saveNewProject;
    };
  }

  // Show Project Details
  function showProjectDetails(project) {
    const client = clients.find((c) => c.id === project.clientId);
    const clientName = client ? client.name : 'No Client Assigned';

    const assignedEmployeeNames = project.assignedEmployees
      .map((employeeId) => {
        const employee = employees.find((e) => e.id === employeeId);
        return employee ? employee.name : 'Unknown';
      })
      .join(', ');

    projectDetailsModal.style.display = 'block';
    projectDetailsContent.innerHTML = `
      <h2>Project Details: ${project.name}</h2>
      <p><strong>Purchase Order:</strong> ${project.purchaseOrder}</p>
      <p><strong>Part Number:</strong> ${project.partNumber}</p>
      <p><strong>Job Number:</strong> ${project.jobNumber}</p>
      <p><strong>Due Date:</strong> ${project.dueDate}</p>
      <p><strong>Quantity:</strong> ${project.quantity}</p>
      <p><strong>Notes:</strong> ${project.notes}</p>
      <p><strong>Assigned Employees:</strong> ${assignedEmployeeNames}</p>
      <p><strong>Priority:</strong> ${project.priority}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Status:</strong> ${project.status}</p>
    `;
  }

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
            <p><strong>Purchase Order:</strong> ${project.purchaseOrder}</p>
            <p><strong>Part Number:</strong> ${project.partNumber}</p>
            <p><strong>Job Number:</strong> ${project.jobNumber}</p>
            <p><strong>Due Date:</strong> ${project.dueDate}</p>
            <p><strong>Quantity:</strong> ${project.quantity}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Priority:</strong> ${project.priority}</p>
            <p><strong>Status:</strong> ${project.status}</p>
          </div>
          <div class="notes">
            <h2>Notes:</h2>
            <p>${project.notes}</p>
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
    project.status = 'Completed';
    update(ref(db, `projects/${project.id}`), { status: 'Completed' });
    renderProjects();
    renderCompletedProjects();
    renderAdminProjects();
  }

  // Search functionality
  document.getElementById('project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'));
    renderProjects(filteredProjects);
  });
  
   // Complete Project
   function completeProject(project) {
    project.status = 'Completed';
    update(ref(db, `projects/${project.id}`), { status: 'Completed' });
    renderProjects();
    renderCompletedProjects();
    renderAdminProjects();
  }

  // Search functionality
  document.getElementById('project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'));
    renderProjects(filteredProjects);
  });
  
  document.getElementById('completed-project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status === 'Completed'));
    renderCompletedProjects(filteredProjects);
  });
  
  document.getElementById('admin-project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredProjects = searchProjects(searchTerm, projects.filter(p => p.status !== 'Completed'));
    renderAdminProjects(filteredProjects);
  });

  // Improved search function
  function searchProjects(searchTerm, projectList) {
    searchTerm = searchTerm.toLowerCase().trim();
    const dateSearch = parseDate(searchTerm);
  
    return projectList.filter(p => {
      const projectDate = new Date(p.dueDate);
      return (
        p.name.toLowerCase().includes(searchTerm) ||
        p.purchaseOrder.toLowerCase().includes(searchTerm) ||
        p.partNumber.toLowerCase().includes(searchTerm) ||
        p.jobNumber.toLowerCase().includes(searchTerm) ||
        p.notes.toLowerCase().includes(searchTerm) ||
        p.priority.toLowerCase().includes(searchTerm) ||
        p.status.toLowerCase().includes(searchTerm) ||
        (clients.find(c => c.id === p.clientId)?.name.toLowerCase().includes(searchTerm)) ||
        (p.assignedEmployees && p.assignedEmployees.some(empId => 
          employees.find(e => e.id === empId)?.name.toLowerCase().includes(searchTerm)
        )) ||
        (dateSearch && isSameDay(projectDate, dateSearch)) ||
        (searchTerm === formatDate(projectDate))
      );
    });
  }

  function parseDate(dateString) {
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  const debouncedSearch = debounce((searchTerm, projectList, renderFunction) => {
    const filteredProjects = searchProjects(searchTerm, projectList);
    renderFunction(filteredProjects);
  }, 300);
  
  document.getElementById('project-search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    debouncedSearch(searchTerm, projects.filter(p => p.status !== 'Completed'), renderProjects);
  });

  function addSearchSuggestions(inputElement, suggestionsList) {
    const datalist = document.createElement('datalist');
    datalist.id = inputElement.id + '-suggestions';
    inputElement.setAttribute('list', datalist.id);
    
    suggestionsList.forEach(suggestion => {
      const option = document.createElement('option');
      option.value = suggestion;
      datalist.appendChild(option);
    });
    
    inputElement.parentNode.insertBefore(datalist, inputElement.nextSibling);
  }
  
  // Call this function after loading data
  function setupSearchSuggestions() {
    const allSearchTerms = [
      ...new Set([
        ...projects.map(p => p.name),
        ...projects.map(p => p.purchaseOrder),
        ...projects.map(p => p.partNumber),
        ...projects.map(p => p.jobNumber),
        ...clients.map(c => c.name),
        ...employees.map(e => e.name),
        ...projects.map(p => p.dueDate)
      ])
    ];
    
    addSearchSuggestions(document.getElementById('project-search-input'), allSearchTerms);
    addSearchSuggestions(document.getElementById('completed-project-search-input'), allSearchTerms);
    addSearchSuggestions(document.getElementById('admin-project-search-input'), allSearchTerms);
  }
  
  // Do the same for completed projects and admin projects search inputs

  // Render Operations
  function renderOperations() {
    const operationsList = document.getElementById('operations-list');
    operationsList.innerHTML = '';
    operations.forEach((operation, index) => {
      const li = document.createElement('li');
      li.textContent = operation;
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('btn-danger');
      deleteBtn.addEventListener('click', () => {
        remove(ref(db, `operations/${index}`));
        operations.splice(index, 1);
        renderOperations();
      });
      li.appendChild(deleteBtn);
      operationsList.appendChild(li);
    });
  }

  const addOperationBtn = document.getElementById('add-operation-btn');
  const newOperationInput = document.getElementById('new-operation-input');

  addOperationBtn.addEventListener('click', () => {
    const operationName = newOperationInput.value.trim();
    if (operationName) {
      push(ref(db, 'operations'), operationName);
      operations.push(operationName);
      renderOperations();
      newOperationInput.value = '';
    } else {
      alert('Please enter a valid operation name.');
    }
  });

  // Render Employees
  function renderEmployees() {
    const employeesContainer = document.getElementById('employees');
    employeesContainer.innerHTML = '';

    employees.forEach((employee, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="employee-name">${employee.name}</span>
        <button class="delete-btn btn-danger">Delete</button>
      `;

      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this employee?')) {
          remove(ref(db, `employees/${employee.id}`));
          employees.splice(index, 1);
          projects.forEach((project) => {
            project.assignedEmployees = project.assignedEmployees.filter((id) => id !== employee.id);
            if (project.activeOperations && project.activeOperations[employee.id]) {
              stopEmployeeOperation(project.id, employee.id);
            }
            update(ref(db, `projects/${project.id}`), project);
          });
          get(ref(db, 'settings/defaultEmployees')).then((snapshot) => {
            if (snapshot.exists()) {
              const defaultEmployees = snapshot.val();
              const updatedDefaultEmployees = defaultEmployees.filter((id) => id !== employee.id);
              update(ref(db, 'settings'), { defaultEmployees: updatedDefaultEmployees });
            }
          });

          renderEmployees();
          renderProjects();
          renderCompletedProjects();
          renderAdminProjects();
        }
      });

      employeesContainer.appendChild(li);
    });
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
            <button class="delete-log-btn btn-danger">Delete</button>
          </td>
        `;

        const viewPauseLogBtn = row.querySelector('.view-pause-log-btn');
        viewPauseLogBtn.addEventListener('click', () => {
          showPauseLogModal(log);
        });

        const deleteLogBtn = row.querySelector('.delete-log-btn');
        deleteLogBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this log entry?')) {
            remove(ref(db, `workLogs/${log.id}`));
            workLogs = workLogs.filter(l => l.id !== log.id);
            renderWorkLogs();
          }
        });

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
        })
        .catch((error) => {
          console.error('Error clearing data:', error);
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
  }

  // Add event listener to the export data button
  document.getElementById('export-data-btn').addEventListener('click', exportData);

  // Show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
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

  // Initial renders
  renderProjects();
  renderCompletedProjects();
  renderAdminProjects();
  renderEmployees();
  renderWorkLogs();
  renderClients();
  renderOperations();
});