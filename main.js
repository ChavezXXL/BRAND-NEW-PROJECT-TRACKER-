// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, push, remove, update, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const settingsSchema = {
  primaryColor: '#3498db',  // Default blue
  accentColor: '#2ecc71',   // Default green
  fontFamily: 'Arial, sans-serif',
  layoutStyle: 'list',
  defaultPriority: 'medium',
  defaultEmployees: [],
  restrictSingleProject: false,
  automaticBreaks: [],
};

const DEFAULT_BREAKS = [
  { start: '10:00', end: '10:15', name: 'Morning Break' },
  { start: '12:00', end: '12:30', name: 'Lunch Break' },
  { start: '15:00', end: '15:15', name: 'Afternoon Break' }
];

function initializeSearch() {
  const searchContainers = [
    { id: 'project-search', type: 'projects' },
    { id: 'completed-search', type: 'completed projects' },
    { id: 'admin-search', type: 'projects' },
    { id: 'deleted-search', type: 'deleted projects' }
  ];

  searchContainers.forEach(({ id, type }) => {
    const container = document.getElementById(id);
    if (container) {
      ReactDOM.render(
        React.createElement(AdvancedSearch, {
          type,
          onSearch: (searchParams) => handleSearch(searchParams, type)
        }),
        container
      );
    }
  });
}

// Add this search handler function
function handleSearch(searchParams, type) {
  const { searchTerm, filters } = searchParams;
  let filteredProjects = [];

  switch (type) {
    case 'projects':
      filteredProjects = projects.filter(project => 
        project.status !== 'Completed' && !project.isDeleted &&
        filterProject(project, searchTerm, filters)
      );
      renderProjects(filteredProjects);
      break;
    case 'completed projects':
      filteredProjects = projects.filter(project => 
        project.status === 'Completed' &&
        filterProject(project, searchTerm, filters)
      );
      renderCompletedProjects(filteredProjects);
      break;
    case 'deleted projects':
      filteredProjects = deletedProjects.filter(project => 
        filterProject(project, searchTerm, filters)
      );
      renderDeletedProjects(filteredProjects);
      break;
  }
}

function filterProject(project, searchTerm, filters) {
  const searchMatch = !searchTerm || 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.purchaseOrder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase());

  const statusMatch = filters.status === 'all' || 
    project.status.toLowerCase() === filters.status;

  const priorityMatch = filters.priority === 'all' || 
    project.priority.toLowerCase() === filters.priority;

  const dateMatch = !filters.dateRange.from || !filters.dateRange.to || 
    (new Date(project.dueDate) >= new Date(filters.dateRange.from) &&
     new Date(project.dueDate) <= new Date(filters.dateRange.to));

  return searchMatch && statusMatch && priorityMatch && dateMatch;
}

// Variables to store data
let projects = [];
let employees = [];
let operations = [];
let workLogs = [];
let clients = [];
let operationTimeStats = [];
let deletedProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  function setupBreakSettingsListeners() {
    const addBreakButton = document.getElementById('add-break');
    if (addBreakButton) {
      addBreakButton.addEventListener('click', () => {
        const newBreak = {
          name: 'New Break',
          start: '12:00',
          end: '12:30'
        };
        
        settingsSchema.automaticBreaks.push(newBreak);
        renderBreakSettings();
        saveSettings();
      });
    }

    const breaksList = document.getElementById('breaks-list');
    if (breaksList) {
      breaksList.addEventListener('change', (e) => {
        if (e.target.matches('.break-name, .break-start, .break-end')) {
          saveSettings();
        }
      });
    }
  }

  // Add this after your DOMContentLoaded event starts
const searchInputs = {
  'project-search-input': renderProjects,
  'completed-project-search-input': renderCompletedProjects,
  'admin-project-search-input': renderAdminProjects,
  'deleted-project-search-input': renderDeletedProjects
};

// Add event listeners for search inputs
Object.entries(searchInputs).forEach(([inputId, renderFunction]) => {
  const searchInput = document.getElementById(inputId);
  if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
          const searchTerm = e.target.value.toLowerCase();
          const filteredProjects = projects.filter(project => {
              return project.name.toLowerCase().includes(searchTerm) ||
                  project.purchaseOrder?.toLowerCase().includes(searchTerm) ||
                  project.partNumber?.toLowerCase().includes(searchTerm) ||
                  project.jobNumber?.toLowerCase().includes(searchTerm) ||
                  project.notes?.toLowerCase().includes(searchTerm);
          });
          renderFunction(filteredProjects);
      }, 300));
  }
});

   // Initialize operation button
   const addOperationBtn = document.getElementById('add-operation-btn');
   if (addOperationBtn) {
     addOperationBtn.addEventListener('click', addOperation);
   } else {
     console.error('Add operation button not found');
   }
 
   // Initial load sequence
loadData()
.then(() => {
  // Setup break settings
  setupBreakSettingsListeners();
  initializeSearch();
  
  // Load settings from Firebase
  return get(ref(db, 'settings'));
})
.then((snapshot) => {
  if (snapshot.exists()) {
    const settings = snapshot.val();
    settingsSchema.automaticBreaks = settings.automaticBreaks || DEFAULT_BREAKS;
    applySettings(settings);
    renderBreakSettings();
    initializeAutomaticBreaks();
  }
})
.catch(error => {
  console.error('Error loading data or settings:', error);
  showNotification('Failed to load settings', 'error');
});

     function renderBreakSettings() {
      const breaksList = document.getElementById('breaks-list');
      if (!breaksList) return;
      
      breaksList.innerHTML = '';
      const breaks = settingsSchema.automaticBreaks.length > 0 
        ? settingsSchema.automaticBreaks 
        : DEFAULT_BREAKS;
      
      breaks.forEach((breakTime, index) => {
        const breakItem = document.createElement('div');
        breakItem.className = 'break-item';
        breakItem.dataset.index = index;
        
        breakItem.innerHTML = `
          <div class="break-inputs">
            <input type="text" 
                   class="break-name" 
                   value="${breakTime.name}" 
                   placeholder="Break Name">
            <div class="time-inputs">
              <input type="time" 
                     class="break-start" 
                     value="${breakTime.start}">
              <span>to</span>
              <input type="time" 
                     class="break-end" 
                     value="${breakTime.end}">
            </div>
            <button class="remove-break btn-danger">Remove</button>
          </div>
        `;
    
        const removeBtn = breakItem.querySelector('.remove-break');
        removeBtn.addEventListener('click', () => removeBreakTime(index));
    
        breaksList.appendChild(breakItem);
      });
    }
    
    function addBreakTime() {
      const newBreak = {
        name: 'New Break',
        start: '12:00',
        end: '12:30'
      };
      
      settingsSchema.automaticBreaks.push(newBreak);
      saveSettings();
    }
    
    function removeBreakTime(index) {
      settingsSchema.automaticBreaks.splice(index, 1);
      saveSettings();
    }

  // Load data from Firebase
function loadData() {
  return Promise.all([
    get(ref(db, 'projects')).catch(e => ({ val: () => [] })),
    get(ref(db, 'employees')).catch(e => ({ val: () => [] })),
    get(ref(db, 'operations')).catch(e => ({ val: () => [] })),
    get(ref(db, 'workLogs')).catch(e => ({ val: () => [] })),
    get(ref(db, 'clients')).catch(e => ({ val: () => [] })),
    get(ref(db, 'settings')).catch(e => ({ val: () => ({}) }))
  ]).then(([projectsSnapshot, employeesSnapshot, operationsSnapshot, workLogsSnapshot, clientsSnapshot, settingsSnapshot]) => {
    try {
      console.log('Data loaded:', {
        projects: projectsSnapshot.val(),
        employees: employeesSnapshot.val(),
        operations: operationsSnapshot.val(),
        workLogs: workLogsSnapshot.val(),
        clients: clientsSnapshot.val(),
        settings: settingsSnapshot.val()
      });
      
      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.val();
        applySettings(settings);
      }

      // Assign snapshot data to local variables
      projects = projectsSnapshot.exists()
        ? Object.entries(projectsSnapshot.val()).map(([key, value]) => ({
            ...value,
            id: key,
            estimatedTime: parseFloat(value.estimatedTime) || 0,
            assignedEmployees: value.assignedEmployees || []
          }))
        : [];
      employees = employeesSnapshot.exists() ? Object.values(employeesSnapshot.val()) : [];
      operations = operationsSnapshot.exists() ? operationsSnapshot.val() : [];
      workLogs = workLogsSnapshot.exists()
        ? Object.entries(workLogsSnapshot.val()).map(([id, logEntry]) => ({ ...logEntry, id }))
        : [];
      clients = clientsSnapshot.exists() ? Object.values(clientsSnapshot.val()) : [];
      deletedProjects = projects.filter(p => p.isDeleted);
      projects = projects.filter(p => !p.isDeleted);

      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.val();
        applySettings(settings);
      }
    } catch (error) {
      console.error('Error processing data:', error);
      showNotification('Error processing data. Using default values.', 'error');

      // Set default values
      projects = [];
      employees = [];
      operations = [];
      workLogs = [];
      clients = [];
    }

    // Now render the data
    renderProjects();
    renderCompletedProjects();
    renderAdminProjects();
    renderEmployees();
    renderWorkLogs();
    renderClients();
    renderOperations();

    // Setup search and other UI elements
    setupImprovedSearch();
    setupSearchSuggestions();
  }).catch(error => {
    console.error("Error loading data:", error);
    showNotification('Failed to load data. Please check console for details.', 'error');
  });
}

  // Set up real-time listeners
  setupRealtimeListeners();

  // Update the project data listener
  function setupRealtimeListeners() {
    const projectsRef = ref(db, 'projects');
    onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const allProjects = Object.entries(projectsData).map(([key, value]) => ({
          ...value,
          id: key,
          estimatedTime: parseFloat(value.estimatedTime) || 0,
          assignedEmployees: value.assignedEmployees || []
        }));
        
        projects = allProjects.filter(p => !p.isDeleted);
        deletedProjects = allProjects.filter(p => p.isDeleted);
        
        requestAnimationFrame(() => {
          renderAll();
        });
      } else {
        projects = [];
        deletedProjects = [];
        requestAnimationFrame(() => {
          renderAll();
        });
      }
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
      if (snapshot.exists()) {
        const newWorkLogs = Object.entries(snapshot.val()).map(([id, logEntry]) => ({ ...logEntry, id }));

        // Update only if there are changes
        if (JSON.stringify(newWorkLogs) !== JSON.stringify(workLogs)) {
          workLogs = newWorkLogs;
          renderWorkLogs();
        }
      } else {
        workLogs = [];
        renderWorkLogs();
      }
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
    if (settings.automaticBreaks) {
      settingsSchema.automaticBreaks = settings.automaticBreaks;
      renderBreakSettings();
      initializeAutomaticBreaks();
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
    const breakItems = document.querySelectorAll('.break-item');
    const breaks = Array.from(breakItems).map(item => ({
      name: item.querySelector('.break-name').value,
      start: item.querySelector('.break-start').value,
      end: item.querySelector('.break-end').value
    }));
  
    const settings = {
      primaryColor: document.getElementById('theme-color')?.value || '#3498db',
      accentColor: document.getElementById('accent-color')?.value || '#2ecc71',
      fontFamily: document.getElementById('font-select')?.value || 'Arial, sans-serif',
      layoutStyle: document.getElementById('layout-select')?.value || 'list',
      defaultPriority: document.getElementById('default-priority')?.value || 'medium',
      defaultEmployees: Array.from(document.getElementById('default-employees')?.selectedOptions || [])
        .map(option => option.value),
      automaticBreaks: breaks,
      restrictSingleProject: document.getElementById('restrict-single-project')?.checked || false
    };
  
    // Save to Firebase
    set(ref(db, 'settings'), settings)
      .then(() => {
        settingsSchema.automaticBreaks = settings.automaticBreaks;
        applySettings(settings);
        initializeAutomaticBreaks();
        showNotification('Settings saved successfully', 'success');
      })
      .catch(error => {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
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

menuIcon.addEventListener('click', (event) => {
  event.stopPropagation(); // Prevent event from bubbling up
  sideMenu.classList.toggle('active');
});

// Handle navigation item clicks
const navItems = [
  'show-project-list-btn',
  'show-completed-projects-btn',
  'show-employee-list-btn',
  'show-work-log-btn',
  'show-settings-btn',
  'show-client-list-btn',
  'show-admin-view-btn',
  'show-deleted-projects-btn'
];

navItems.forEach(itemId => {
  const navItem = document.getElementById(itemId);
  if (navItem) {
    navItem.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent event from bubbling up
      const sectionId = itemId.replace('show-', '').replace('-btn', '');
      showSection(sectionId);
      sideMenu.classList.remove('active'); // Close menu after navigation
    });
  }
});

// Only close menu when clicking outside both the menu and the menu icon
document.addEventListener('click', (event) => {
  if (!sideMenu.contains(event.target) && 
      !menuIcon.contains(event.target) && 
      event.target.closest('.side-menu') === null) {
    sideMenu.classList.remove('active');
  }
});

// Prevent menu from closing when clicking inside it
sideMenu.addEventListener('click', (event) => {
  event.stopPropagation(); // Prevent clicks inside menu from bubbling up
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
  
    // Delegate event listener for break item changes
    document.getElementById('breaks-list')?.addEventListener('change', (e) => {
      if (e.target.classList.contains('break-name') ||
          e.target.classList.contains('break-start') ||
          e.target.classList.contains('break-end')) {
        saveSettings();
      }
    });

  function renderDeletedProjects(filteredProjects = null) {
    const container = document.getElementById('deleted-projects-container');
    if (!container) return;

    container.innerHTML = '';
    
    if (deletedProjects.length === 0) {
        container.innerHTML = '<p class="no-data">No deleted projects</p>';
        return;
    }

    const projectsToRender = filteredProjects || deletedProjects;
    const projectsByClient = groupProjectsByClient(projectsToRender);

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
            const projectCard = createProjectCard(project, true);
            // Add deletion date info
            const deletionInfo = document.createElement('div');
            deletionInfo.className = 'deletion-info';
            deletionInfo.textContent = `Deleted on: ${new Date(project.deletedAt).toLocaleDateString()}`;
            projectCard.insertBefore(deletionInfo, projectCard.querySelector('.action-buttons'));
            clientSection.appendChild(projectCard);
        });

        container.appendChild(clientSection);
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
  document.getElementById('show-deleted-projects-btn').addEventListener('click', () => 
    showSection('deleted-projects')
);

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
  });

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

  // Update saveNewProject to immediately render
  function saveNewProject() {
    try {
      // Disable the save button to prevent double submission
      const saveButton = document.getElementById('save-project-btn');
      if (saveButton) {
        saveButton.disabled = true;
      }
  
      const projectData = {
        id: generateId(),
        name: document.getElementById('project-name').value.trim(),
        purchaseOrder: document.getElementById('purchase-order').value.trim() || '',
        partNumber: document.getElementById('part-number').value.trim() || '',
        jobNumber: document.getElementById('job-number').value.trim() || '',
        dueDate: document.getElementById('due-date').value || '',
        quantity: document.getElementById('quantity').value.trim() || '',
        notes: document.getElementById('notes').value.trim() || '',
        assignedEmployees: Array.from(document.getElementById('project-employees').selectedOptions).map(
          (option) => option.value
        ),
        priority: document.getElementById('project-priority').value || 'medium',
        status: 'Not Started',
        clientId: document.getElementById('project-client').value || '',
        estimatedTime: parseFloat(document.getElementById('estimated-time').value) || 0,
        actualTime: 0,
        isDeleted: false,
        createdAt: Date.now()
      };
  
      // Validate before proceeding
      if (!projectData.name) {
        throw new Error('Project name is required');
      }
  
      validateProjectData(projectData);
      
      // First, create a loading notification
      showNotification('Saving project...', 'info');
      
      // Return the promise chain for proper error handling
      return set(ref(db, `projects/${projectData.id}`), projectData)
        .then(() => {
          // Close modal and reset form
          const projectModal = document.getElementById('project-modal');
          const projectForm = document.getElementById('project-form');
          
          if (projectModal) {
            projectModal.style.display = 'none';
          }
          if (projectForm) {
            projectForm.reset();
          }
          
          showNotification('Project saved successfully', 'success');
        })
        .catch((error) => {
          console.error('Error saving project:', error);
          showNotification('Failed to save project: ' + error.message, 'error');
          throw error;
        })
        .finally(() => {
          // Re-enable the save button
          if (saveButton) {
            saveButton.disabled = false;
          }
        });
    } catch (error) {
      // Re-enable the save button if validation fails
      const saveButton = document.getElementById('save-project-btn');
      if (saveButton) {
        saveButton.disabled = false;
      }
      showNotification('Invalid project data: ' + error.message, 'error');
      return Promise.reject(error);
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
    try {
      const operation = document.getElementById('operation-select').value;
      const operationEmployeesSelect = document.getElementById('operation-employees');
      const selectedOptions = operationEmployeesSelect.selectedOptions;
      
      console.log('Selected operation:', operation);
      console.log('Selected employees element:', operationEmployeesSelect);
      console.log('Selected options:', selectedOptions);
  
      if (!operation) {
        showNotification('Please select an operation', 'warning');
        return;
      }
  
      if (!selectedOptions || selectedOptions.length === 0) {
        showNotification('Please select at least one employee', 'warning');
        return;
      }
  
      const selectedEmployeeIds = Array.from(selectedOptions).map(option => option.value);
      console.log('Selected employee IDs:', selectedEmployeeIds);
  
      const projectId = operationModal.getAttribute('data-project-id');
      if (!projectId) {
        showNotification('Project ID not found', 'error');
        return;
      }
  
      selectedEmployeeIds.forEach((employeeId) => {
        startEmployeeOperation(projectId, employeeId, operation);
      });
  
      operationModal.style.display = 'none';
      document.getElementById('operation-form').reset();
  
    } catch (error) {
      console.error('Error starting operation:', error);
      showNotification('Error starting operation', 'error');
    }
  });

  cancelOperationBtn.addEventListener('click', () => {
    operationModal.style.display = 'none';
    operationForm.reset();
  });

  function showEmployeeOperationModal(projectId) {
    console.log('Opening operation modal for project:', projectId);
    
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      showNotification('Error: Project not found', 'error');
      return;
    }
  
    const operationModal = document.getElementById('operation-modal');
    if (!operationModal) {
      console.error('Operation modal element not found');
      showNotification('Error: Operation modal not found', 'error');
      return;
    }
  
    try {
      // Show modal and set project ID
      operationModal.style.display = 'block';
      operationModal.setAttribute('data-project-id', projectId);
  
      // Load operations
      console.log('Loading operations:', operations);
      loadOperationsToSelect();
  
      // Load employees
      console.log('Loading employees for project:', project.assignedEmployees);
      loadAssignedEmployeesToOperationSelect(project.assignedEmployees);
  
    } catch (error) {
      console.error('Error showing operation modal:', error);
      showNotification('Error showing operation modal', 'error');
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
  clientForm.reset();

  // Set the save button to save a new client
  saveClientBtn.onclick = saveNewClient;
});

closeClientModalBtn.addEventListener('click', () => {
  clientModal.style.display = 'none';
  clientForm.reset();

  // Reset the save button to default action
  saveClientBtn.onclick = saveNewClient;
});

// Save New Client
function saveNewClient() {
  console.log('saveNewClient called'); // Debug log to confirm function call

  try {
    const clientName = document.getElementById('client-name').value.trim();
    if (!clientName) {
      showNotification('Please enter a valid client name.', 'warning');
      return;
    }

    // Disable save button to prevent multiple submissions
    saveClientBtn.disabled = true;

    const newClient = {
      id: generateId(),
      name: clientName,
      contact: document.getElementById('client-contact').value.trim() || '',
      phone: document.getElementById('client-phone').value.trim() || '',
      email: document.getElementById('client-email').value.trim() || '',
      address: document.getElementById('client-address').value.trim() || '',
      createdAt: Date.now()
    };

    // Validate client data
    validateClientData(newClient);

    // Save to Firebase
    set(ref(db, `clients/${newClient.id}`), newClient)
      .then(() => {
        // Close the modal and reset the form
        clientModal.style.display = 'none';
        clientForm.reset();

        // Re-enable the save button
        saveClientBtn.disabled = false;

        showNotification('Client added successfully', 'success');

        // Manually update the clients array and re-render
        clients.push(newClient);
        renderClients();
      })
      .catch((error) => {
        console.error('Error adding client:', error);
        showNotification('Failed to add client: ' + error.message, 'error');
        saveClientBtn.disabled = false;
      });
  } catch (error) {
    console.error('Error in saveNewClient:', error);
    showNotification('Failed to add client: ' + error.message, 'error');
    saveClientBtn.disabled = false;
  }
}

// Edit Client
function editClient(client) {
  if (!client || !client.id) {
    showNotification('Invalid client data', 'error');
    return;
  }

  // Populate form fields with the client's existing data
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-contact').value = client.contact || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-address').value = client.address || '';

  // Display the client modal
  clientModal.style.display = 'block';

  // Update the save button's onclick handler to update the client
  saveClientBtn.onclick = function () {
    updateClient(client.id);
  };
}

// Render Clients
function renderClients() {
  console.log('renderClients called');
  console.log('clients array:', clients);

  const clientsContainer = document.getElementById('clients');
  if (!clientsContainer) {
    console.error('Clients container element not found');
    return;
  }

  clientsContainer.innerHTML = '';

  if (clients.length === 0) {
    clientsContainer.innerHTML = '<p>No clients found.</p>';
    return;
  }

  clients.forEach(client => {
    const clientItem = document.createElement('li');
    clientItem.classList.add('client-item');
    clientItem.innerHTML = `
      <div class="client-info">
        <h3>${client.name}</h3>
        <p><strong>Contact:</strong> ${client.contact || 'N/A'}</p>
        <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
        <p><strong>Email:</strong> ${client.email || 'N/A'}</p>
        <p><strong>Address:</strong> ${client.address || 'N/A'}</p>
      </div>
      <div class="client-actions">
        <button class="edit-client-btn btn-secondary">Edit</button>
        <button class="delete-client-btn btn-danger">Delete</button>
      </div>
    `;

    // Add event listeners to the buttons
    const editBtn = clientItem.querySelector('.edit-client-btn');
    editBtn.addEventListener('click', () => editClient(client));

    const deleteBtn = clientItem.querySelector('.delete-client-btn');
    deleteBtn.addEventListener('click', () => deleteClient(client.id));

    clientsContainer.appendChild(clientItem);
  });
}

// Update Client
function updateClient(clientId) {
  const updatedClient = {
    name: document.getElementById('client-name').value.trim(),
    contact: document.getElementById('client-contact').value.trim(),
    phone: document.getElementById('client-phone').value.trim(),
    email: document.getElementById('client-email').value.trim(),
    address: document.getElementById('client-address').value.trim(),
    updatedAt: Date.now()
  };

  if (!updatedClient.name) {
    showNotification('Client name is required', 'warning');
    return;
  }

  update(ref(db, `clients/${clientId}`), updatedClient)
    .then(() => {
      clientModal.style.display = 'none';
      clientForm.reset();

      // Reset the save button to default action
      saveClientBtn.onclick = saveNewClient;

      // Update the local clients array
      const index = clients.findIndex(client => client.id === clientId);
      if (index !== -1) {
        clients[index] = { ...clients[index], ...updatedClient };
        renderClients();
      }

      showNotification('Client updated successfully', 'success');
    })
    .catch((error) => {
      console.error('Error updating client:', error);
      showNotification('Failed to update client: ' + error.message, 'error');
    });
}

// Delete Client
function deleteClient(clientId) {
  if (!clientId) {
    showNotification('Invalid client ID', 'error');
    return;
  }

  if (confirm('Are you sure you want to delete this client?')) {
    // Check if client has associated projects first
    get(ref(db, 'projects'))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const projectsData = snapshot.val();
          const hasProjects = Object.values(projectsData).some(
            project => project.clientId === clientId && !project.isDeleted
          );

          if (hasProjects) {
            throw new Error('Cannot delete client with active projects');
          }

          return remove(ref(db, `clients/${clientId}`));
        } else {
          // If no projects exist, proceed to delete the client
          return remove(ref(db, `clients/${clientId}`));
        }
      })
      .then(() => {
        // Remove the client from the local clients array
        clients = clients.filter(client => client.id !== clientId);
        renderClients();

        showNotification('Client deleted successfully', 'success');
      })
      .catch((error) => {
        console.error('Error deleting client:', error);
        showNotification(error.message, 'error');
      });
  }
}

// Validate Client Data
function validateClientData(clientData) {
  if (!clientData.name || clientData.name.trim() === '') {
    throw new Error('Client name is required');
  }

  if (clientData.email && !isValidEmail(clientData.email)) {
    throw new Error('Invalid email format');
  }

  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

  // Render Projects
  function renderProjects(filteredProjects = null) {
    const projectsContainer = document.getElementById('projects');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = '';
    const layoutStyle = document.getElementById('layout-select')?.value || 'grid';
    projectsContainer.classList.toggle('list-view', layoutStyle === 'list');
    
    const projectsToRender = filteredProjects || projects;
    const activeProjects = projectsToRender.filter((p) => p.status !== 'Completed' && !p.isDeleted);
    const projectsByClient = groupProjectsByClient(activeProjects);
    renderProjectGroups(projectsContainer, projectsByClient, false);
  }

  // Render Completed Projects
  function renderCompletedProjects(filteredProjects = null) {
    const completedProjectsContainer = document.getElementById('completed-projects-container');
    if (!completedProjectsContainer) return;
    
    completedProjectsContainer.innerHTML = '';
  
    const layoutStyle = document.getElementById('layout-select').value || 'grid';
    if (layoutStyle === 'list') {
      completedProjectsContainer.classList.add('list-view');
    } else {
      completedProjectsContainer.classList.remove('list-view');
    }
  
    const projectsToRender = filteredProjects || projects;
    // Only show projects that are completed AND not deleted
    const completedProjects = projectsToRender.filter((p) => p.status === 'Completed' && !p.isDeleted);
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
  
    // Generate timer HTML
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
  
    // Project card main content
    projectCard.innerHTML = `
    <div class="project-header">
      <h3>${project.name}</h3>
      <div class="project-timer">
        <p><strong>Estimated Time:</strong> ${formatDuration(estimatedTimeMs)}</p>
        ${timersHTML}
      </div>
    </div>
    <div class="project-details">
      ${isAdminView ? getOperationTimeSummary(project) : ''}
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
        ${project.status === 'Completed' ? `
          <button class="restore-completed-btn btn-secondary">Restore to Active</button>
          <button class="delete-completed-btn btn-danger">Delete Project</button>
        ` : project.isDeleted ? `
          <button class="restore-btn btn-primary">Restore Project</button>
          <button class="permanently-delete-btn btn-danger">Delete Permanently</button>
        ` : `
          ${project.status !== 'Completed' ? `
            <button class="start-operation-btn">Start Operation</button>
            <button class="complete-btn">Mark as Completed</button>
          ` : ''}
          ${isAdminView ? `
            <button class="view-details-btn">View Details</button>
            <button class="print-btn">Print</button>
            ${project.status !== 'Completed' ? `<button class="edit-btn">Edit</button>` : ''}
            <button class="delete-btn">Delete</button>
          ` : ''}
        `}
      </div>
    `;
  
    // Add event listeners for completed project buttons
    if (project.status === 'Completed') {
      const restoreBtn = projectCard.querySelector('.restore-completed-btn');
      const deleteBtn = projectCard.querySelector('.delete-completed-btn');
  
      if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
          update(ref(db, `projects/${project.id}`), { status: 'Not Started' })
            .then(() => {
              project.status = 'Not Started';
              renderAll();
              showNotification('Project restored to active', 'success');
            })
            .catch(error => {
              console.error('Error restoring project:', error);
              showNotification('Failed to restore project', 'error');
            });
        });
      }
  
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this completed project?')) {
            deleteProject(project.id);
          }
        });
      }
    }
  
    // Add event listeners for deleted project buttons
    if (project.isDeleted) {
      const restoreBtn = projectCard.querySelector('.restore-btn');
      const permanentlyDeleteBtn = projectCard.querySelector('.permanently-delete-btn');
  
      if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
          update(ref(db, `projects/${project.id}`), { 
            isDeleted: false,
            deletedAt: null
          })
          .then(() => {
            const index = deletedProjects.findIndex(p => p.id === project.id);
            if (index !== -1) {
              const restoredProject = { ...deletedProjects[index], isDeleted: false };
              delete restoredProject.deletedAt;
              projects.push(restoredProject);
              deletedProjects.splice(index, 1);
            }
            renderAll();
            showNotification('Project restored successfully', 'success');
          })
          .catch(error => {
            console.error('Error restoring project:', error);
            showNotification('Failed to restore project', 'error');
          });
        });
      }
  
      if (permanentlyDeleteBtn) {
        permanentlyDeleteBtn.addEventListener('click', () => {
          if (confirm('This will permanently delete the project. This action cannot be undone. Continue?')) {
            remove(ref(db, `projects/${project.id}`))
              .then(() => {
                deletedProjects = deletedProjects.filter(p => p.id !== project.id);
                renderAll();
                showNotification('Project permanently deleted', 'success');
              })
              .catch(error => {
                console.error('Error permanently deleting project:', error);
                showNotification('Failed to delete project', 'error');
              });
          }
        });
      }
    }
  
    // Add event listeners for active project buttons
    if (!project.isDeleted && project.status !== 'Completed') {
      const startOperationBtn = projectCard.querySelector('.start-operation-btn');
      const completeBtn = projectCard.querySelector('.complete-btn');
      const viewDetailsBtn = projectCard.querySelector('.view-details-btn');
      const printBtn = projectCard.querySelector('.print-btn');
      const editBtn = projectCard.querySelector('.edit-btn');
      const deleteBtn = projectCard.querySelector('.delete-btn');
  
      if (startOperationBtn) {
        startOperationBtn.addEventListener('click', () => showEmployeeOperationModal(project.id));
      }
  
      if (completeBtn) {
        completeBtn.addEventListener('click', () => completeProject(project));
      }
  
      if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => showProjectDetails(project));
      }
  
      if (printBtn) {
        printBtn.addEventListener('click', () => printProjectDetails(project));
      }
  
      if (editBtn) {
        editBtn.addEventListener('click', () => editProject(project));
      }
  
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this project?')) {
            deleteProject(project.id);
          }
        });
      }
    }
  
    // Add event listeners for timer controls
    projectCard.addEventListener('click', (event) => {
      if (event.target.classList.contains('stop-employee-btn')) {
        const employeeId = event.target.getAttribute('data-employee-id');
        stopEmployeeOperation(project.id, employeeId);
      } else if (event.target.classList.contains('pause-resume-btn')) {
        const employeeId = event.target.getAttribute('data-employee-id');
        pauseResumeEmployeeOperation(project.id, employeeId);
      }
    });
  
    return projectCard;
  }

  // Start Employee Operation Timer
  function startEmployeeOperation(projectId, employeeId, operation) {
    if (!projectId || !employeeId || !operation) {
      showNotification('Missing required information', 'error');
      return Promise.reject(new Error('Missing required information'));
    }
  
    const project = projects.find(p => p.id === projectId);
    const employee = employees.find(e => e.id === employeeId);
  
    if (!project || !employee) {
      showNotification('Project or employee not found', 'error');
      return Promise.reject(new Error('Project or employee not found'));
    }
  
    // Check if employee is already working on another project
    const activeInOtherProject = projects.some(p => 
      p.id !== projectId && 
      p.activeOperations && 
      p.activeOperations[employeeId]
    );
  
    if (activeInOtherProject) {
      showNotification(`${employee.name} must complete their current project first`, 'error');
      return Promise.reject(new Error('Employee already active in another project'));
    }
  
    // Create work log entry
    const logEntry = {
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
      pauseLog: []
    };
  
    return push(ref(db, 'workLogs'))
      .then(newLogRef => {
        const operationData = {
          logEntryId: newLogRef.key,
          operation: operation,
          isPaused: false,
          pauseStartTime: null,
          timerId: null
        };
  
        const updates = {
          [`projects/${project.id}/activeOperations/${employeeId}`]: operationData,
          [`projects/${project.id}/status`]: 'In Progress',
          [`workLogs/${newLogRef.key}`]: logEntry
        };
  
        return update(ref(db), updates).then(() => {
          // Update local state
          if (!project.activeOperations) {
            project.activeOperations = {};
          }
          project.activeOperations[employeeId] = operationData;
          project.status = 'In Progress';
  
          // Start timer updates
          const timerId = setInterval(() => updateTimerDisplay(projectId, employeeId), 1000);
          project.activeOperations[employeeId].timerId = timerId;
  
          renderProjects();
          renderAdminProjects();
          showNotification(`${employee.name} started ${operation} on ${project.name}`, 'success');
          return { success: true };
        });
      })
      .catch(error => {
        console.error('Error starting operation:', error);
        showNotification('Failed to start operation: ' + error.message, 'error');
        throw error;
      });
  }
  
  // Add cleanup function for page unload
  window.addEventListener('beforeunload', () => {
    projects.forEach(project => {
      if (project.activeOperations) {
        Object.keys(project.activeOperations).forEach(employeeId => {
          const operation = project.activeOperations[employeeId];
          if (operation.timer) {
            operation.timer.stop();
          }
        });
      }
    });
  });
  
  // Helper function to cleanup timers
  function cleanupProjectTimers(projectId, employeeId) {
    const project = projects.find(p => p.id === projectId);
    if (project?.activeOperations?.[employeeId]?.timerId) {
      clearInterval(project.activeOperations[employeeId].timerId);
      project.activeOperations[employeeId].timerId = null;
    }
  }
  
  // Add this to your window unload handler
  window.addEventListener('beforeunload', () => {
    projects.forEach(project => {
      if (project.activeOperations) {
        Object.keys(project.activeOperations).forEach(employeeId => {
          cleanupProjectTimers(project.id, employeeId);
        });
      }
    });
  });

  // Add this to your project card creation function (within createProjectCard)
function getOperationTimeSummary(project) {
  const times = calculateOperationTimes(project.id);
  let summaryHTML = `
      <div class="operation-times-summary">
          <h4>Operation Times</h4>
          <div class="operation-progress">`;
  
  Object.keys(times.byOperation).forEach(operation => {
      const stats = times.byOperation[operation];
      const completionRate = times.completionRates[operation].toFixed(1);
      const avgDuration = formatDuration(times.averageDuration[operation]);
      
      summaryHTML += `
          <div class="operation-stat">
              <div class="operation-header">
                  <span>${operation}</span>
                  <span class="completion-rate">${completionRate}% Complete</span>
              </div>
              <div class="time-stats">
                  <span>Total: ${formatDuration(stats.totalTime)}</span>
                  <span>Avg: ${avgDuration}</span>
              </div>
              <div class="progress-bar">
                  <div class="progress" style="width: ${completionRate}%"></div>
              </div>
          </div>`;
  });

  summaryHTML += `
          </div>
          <div class="total-time">
              <strong>Total Project Time:</strong> ${formatDuration(times.total)}
          </div>
      </div>`;

  return summaryHTML;
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
            clearInterval(timer.timerId);
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
    get(ref(db, `workLogs`)).then((snapshot) => {
      if (snapshot.exists()) {
        const allLogs = snapshot.val();
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

  // Helper Functions
  function generateId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${randomStr}`;
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

    const projectEmployeesSelect = document.getElementById('project-employees');
    Array.from(projectEmployeesSelect.options).forEach((option) => {
      option.selected = project.assignedEmployees?.includes(option.value) || false;
    });

    projectModal.style.display = 'block';

    saveProjectBtn.onclick = function () {
      const updatedFields = {
        name: document.getElementById('project-name').value,
        purchaseOrder: document.getElementById('purchase-order').value,
        partNumber: document.getElementById('part-number').value,
        jobNumber: document.getElementById('job-number').value,
        dueDate: document.getElementById('due-date').value,
        quantity: document.getElementById('quantity').value,
        notes: document.getElementById('notes').value,
        assignedEmployees: Array.from(projectEmployeesSelect.selectedOptions).map(
          (option) => option.value
        ),
        priority: document.getElementById('project-priority').value,
        clientId: document.getElementById('project-client').value,
        estimatedTime: parseFloat(document.getElementById('estimated-time').value) || 0
      };
  
      update(ref(db, `projects/${project.id}`), updatedFields)
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
  

// Add these new functions for enhanced time tracking
function calculateOperationTimes(projectId) {
  const projectLogs = workLogs.filter(log => log.projectId === projectId);
  const operationTimes = {
      total: 0,
      byOperation: {},
      completionRates: {},
      averageDuration: {}
  };

  projectLogs.forEach(log => {
      const duration = log.duration || 0;
      const operation = log.operation;

      // Total project time
      operationTimes.total += duration;

      // Time by operation
      if (!operationTimes.byOperation[operation]) {
          operationTimes.byOperation[operation] = {
              totalTime: 0,
              count: 0,
              completedCount: 0,
              lastDuration: 0
          };
      }

      operationTimes.byOperation[operation].totalTime += duration;
      operationTimes.byOperation[operation].count++;
      
      if (log.endTime) {
          operationTimes.byOperation[operation].completedCount++;
          operationTimes.byOperation[operation].lastDuration = duration;
      }
  });

  // Calculate completion rates and averages
  Object.keys(operationTimes.byOperation).forEach(operation => {
      const stats = operationTimes.byOperation[operation];
      operationTimes.completionRates[operation] = 
          (stats.completedCount / stats.count) * 100;
      operationTimes.averageDuration[operation] = 
          stats.totalTime / stats.completedCount;
  });

  return operationTimes;
}

  // Complete Project
  function completeProject(project) {
    project.status = 'Completed';
    update(ref(db, `projects/${project.id}`), { status: 'Completed' })
      .then(() => {
        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        showNotification(`Project "${project.name}" marked as Completed.`, 'success');
      })
      .catch(error => {
        console.error('Error completing project:', error);
        showNotification('Failed to complete the project. Please try again.', 'error');
      });
  }

  // Delete Project
  function deleteProject(projectId) {
    console.log('Attempting to delete project:', projectId);
    
    if (!projectId) {
      console.error('Invalid project ID provided');
      showNotification('Invalid project ID', 'error');
      return;
    }
  
    if (confirm('Move this project to trash? You can restore it later.')) {
      const projectRef = ref(db, `projects/${projectId}`);
      
      // First, get the current project data
      get(projectRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            throw new Error('Project not found');
          }
          
          const projectData = snapshot.val();
          console.log('Current project data:', projectData);
          
          const updatedProject = {
            ...projectData,
            isDeleted: true,
            deletedAt: Date.now()
          };
          
          console.log('Updating project with:', updatedProject);
          
          return update(projectRef, updatedProject);
        })
        .then(() => {
          // Update local arrays
          const projectIndex = projects.findIndex(p => p.id === projectId);
          console.log('Project index in active projects:', projectIndex);
          
          if (projectIndex !== -1) {
            const deletedProject = {
              ...projects[projectIndex],
              isDeleted: true,
              deletedAt: Date.now()
            };
            
            // Remove from active projects
            projects.splice(projectIndex, 1);
            
            // Add to deleted projects
            deletedProjects.push(deletedProject);
            
            console.log('Updated projects array:', projects);
            console.log('Updated deletedProjects array:', deletedProjects);
            
            // Render all affected views
            renderProjects();
            renderCompletedProjects();
            renderAdminProjects();
            renderDeletedProjects(); // Make sure this is being called
            
            showNotification('Project moved to trash', 'success');
          } else {
            console.error('Project not found in active projects array');
          }
        })
        .catch(error => {
          console.error('Error in delete operation:', error);
          showNotification('Failed to move project to trash: ' + error.message, 'error');
        });
    }
  }
  
  // Enhanced renderDeletedProjects function with logging
  function renderDeletedProjects(filteredProjects = null) {
    console.log('Rendering deleted projects. Current deletedProjects array:', deletedProjects);
    
    const container = document.getElementById('deleted-projects-container');
    if (!container) {
      console.error('Deleted projects container not found');
      return;
    }
  
    container.innerHTML = '';
    
    const projectsToRender = filteredProjects || deletedProjects;
    console.log('Projects to render in trash:', projectsToRender);
    
    if (projectsToRender.length === 0) {
      container.innerHTML = '<p class="no-data">No deleted projects</p>';
      return;
    }
  
    projectsToRender.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.classList.add('project-card', 'deleted-project');
      projectCard.setAttribute('data-project-id', project.id);
  
      const client = clients.find(c => c.id === project.clientId);
      const clientName = client ? client.name : 'No Client Assigned';
  
      projectCard.innerHTML = `
        <div class="project-header">
          <h3>${project.name}</h3>
          <span class="deletion-date">Deleted: ${new Date(project.deletedAt).toLocaleDateString()}</span>
        </div>
        <div class="project-details">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Purchase Order:</strong> ${project.purchaseOrder || 'N/A'}</p>
          <p><strong>Status before deletion:</strong> ${project.status || 'N/A'}</p>
        </div>
        <div class="action-buttons">
          <button class="restore-btn btn-primary">Restore Project</button>
          <button class="permanently-delete-btn btn-danger">Delete Permanently</button>
        </div>
      `;
  
      // Add event listeners
      projectCard.querySelector('.restore-btn').addEventListener('click', () => {
        restoreProject(project.id);
      });
  
      projectCard.querySelector('.permanently-delete-btn').addEventListener('click', () => {
        if (confirm('This will permanently delete the project. This action cannot be undone. Continue?')) {
          permanentlyDeleteProject(project.id);
        }
      });
  
      container.appendChild(projectCard);
    });
  }
  
  // Make sure this initialization code is present
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize deletedProjects array if it doesn't exist
    if (!window.deletedProjects) {
      window.deletedProjects = [];
    }
  
    // Add listener for trash section
    document.getElementById('show-deleted-projects-btn').addEventListener('click', () => {
      console.log('Showing deleted projects section');
      showSection('deleted-projects');
      renderDeletedProjects();
    });
  });
  
  // Enhanced showSection function
  function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    document.querySelectorAll('.content').forEach((content) => {
      content.style.display = 'none';
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
      
      // If showing deleted projects, render them
      if (sectionId === 'deleted-projects') {
        renderDeletedProjects();
      }
    } else {
      console.error('Section not found:', sectionId);
    }
  }

// Add new permanent delete function
function permanentlyDeleteProject(projectId) {
  if (confirm('This will permanently delete the project. This action cannot be undone. Continue?')) {
      remove(ref(db, `projects/${projectId}`))
          .then(() => {
              deletedProjects = deletedProjects.filter(p => p.id !== projectId);
              
              // Clean up related work logs
              const projectLogs = workLogs.filter(log => log.projectId === projectId);
              projectLogs.forEach(log => {
                  remove(ref(db, `workLogs/${log.id}`));
                  workLogs = workLogs.filter(l => l.id !== log.id);
              });

              renderDeletedProjects();
              showNotification('Project permanently deleted', 'success');
          })
          .catch(error => {
              console.error('Error permanently deleting project:', error);
              showNotification('Failed to delete project. Please try again.', 'error');
          });
  }
}

// Add restore function
function restoreProject(projectId) {
  const project = deletedProjects.find(p => p.id === projectId);
  if (project) {
      delete project.isDeleted;
      delete project.deletedAt;

      update(ref(db, `projects/${projectId}`), {
          isDeleted: null,
          deletedAt: null
      })
      .then(() => {
          projects.push(project);
          deletedProjects = deletedProjects.filter(p => p.id !== projectId);
          
          renderAll();
          showNotification('Project restored successfully', 'success');
      })
      .catch(error => {
          console.error('Error restoring project:', error);
          showNotification('Failed to restore project. Please try again.', 'error');
      });
  }
}

  // Improved search function
  function searchProjects(searchTerm, projectList) {
    searchTerm = searchTerm.toLowerCase().trim();
    const dateSearch = parseDate(searchTerm);
  
    return projectList.filter(p => {
      try {
        const projectDate = new Date(p.dueDate);
        const clientName = (() => {
          const client = clients.find(c => c.id === p.clientId);
          return client && client.name ? client.name.toLowerCase() : '';
        })();
        const employeeNames = p.assignedEmployees ? p.assignedEmployees.map(empId => {
          const employee = employees.find(e => e.id === empId);
          return employee && employee.name ? employee.name.toLowerCase() : '';
        }) : [];
  
        const match = (
          (p.name && p.name.toLowerCase().includes(searchTerm)) ||
          (p.purchaseOrder && p.purchaseOrder.toLowerCase().includes(searchTerm)) ||
          (p.partNumber && p.partNumber.toLowerCase().includes(searchTerm)) ||
          (p.jobNumber && p.jobNumber.toLowerCase().includes(searchTerm)) ||
          (p.notes && p.notes.toLowerCase().includes(searchTerm)) ||
          (p.priority && p.priority.toLowerCase().includes(searchTerm)) ||
          (p.status && p.status.toLowerCase().includes(searchTerm)) ||
          (clientName && clientName.includes(searchTerm)) ||
          (employeeNames.some(name => name.includes(searchTerm))) ||
          (dateSearch && isSameDay(projectDate, dateSearch)) ||
          (searchTerm === formatDate(projectDate))
        );
  
        // Debug log
        console.log(`Project ${p.name} matches search: ${match}`);
  
        return match;
      } catch (error) {
        console.error('Error during search filter:', error);
        return false;
      }
    });
  }  

  function setupEnhancedSearch() {
    const searchContainers = [
      {
        inputId: 'project-search-input',
        containerId: 'project-search-container',
        title: 'Active Projects'
      },
      {
        inputId: 'completed-project-search-input',
        containerId: 'completed-search-container',
        title: 'Completed Projects'
      },
      {
        inputId: 'admin-project-search-input',
        containerId: 'admin-search-container',
        title: 'Admin Projects'
      }
    ];
  
    searchContainers.forEach(({ inputId, containerId, title }) => {
      const container = document.getElementById(containerId);
      if (!container) return;
  
      // Add advanced search controls
      container.innerHTML = `
        <div class="search-controls">
          <div class="search-input-group">
            <input type="text" id="${inputId}" placeholder="Search ${title}...">
            <select id="${inputId}-filter" class="search-filter">
              <option value="all">All Fields</option>
              <option value="name">Project Name</option>
              <option value="po">Purchase Order</option>
              <option value="part">Part Number</option>
              <option value="job">Job Number</option>
              <option value="client">Client</option>
              <option value="employee">Employee</option>
              <option value="date">Due Date</option>
            </select>
          </div>
          <div class="search-options">
            <select id="${inputId}-sort" class="sort-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="due-date">Due Date</option>
            </select>
            <div class="date-range">
              <input type="date" id="${inputId}-date-from" placeholder="From Date">
              <input type="date" id="${inputId}-date-to" placeholder="To Date">
            </div>
          </div>
          <div class="quick-filters">
            <button class="quick-filter" data-days="7">Last 7 Days</button>
            <button class="quick-filter" data-days="30">Last 30 Days</button>
            <button class="quick-filter" data-days="90">Last 90 Days</button>
          </div>
        </div>
        <div class="search-tags" id="${inputId}-tags"></div>
      `;
  
      // Add event listeners
      setupSearchEventListeners(inputId, title.toLowerCase());
    });
  }
  
  function setupSearchEventListeners(inputId, section) {
    const searchInput = document.getElementById(inputId);
    const filterSelect = document.getElementById(`${inputId}-filter`);
    const sortSelect = document.getElementById(`${inputId}-sort`);
    const dateFrom = document.getElementById(`${inputId}-date-from`);
    const dateTo = document.getElementById(`${inputId}-date-to`);
    const tagsContainer = document.getElementById(`${inputId}-tags`);
  
    // Create search tags
    function addSearchTag(value, type) {
      const tag = document.createElement('span');
      tag.className = 'search-tag';
      tag.innerHTML = `${type}: ${value} <button class="remove-tag">×</button>`;
      tag.querySelector('.remove-tag').addEventListener('click', () => {
        tag.remove();
        performSearch();
      });
      tagsContainer.appendChild(tag);
    }
  
    // Debounced search function
    const debouncedSearch = debounce(() => {
      const searchTerm = searchInput.value;
      const filterType = filterSelect.value;
      const sortType = sortSelect.value;
      const fromDate = dateFrom.value;
      const toDate = dateTo.value;
  
      const filteredResults = filterAndSortResults(
        searchTerm,
        filterType,
        sortType,
        fromDate,
        toDate,
        section
      );
  
      // Update the appropriate section
      switch(section) {
        case 'active projects':
          renderProjects(filteredResults);
          break;
        case 'completed projects':
          renderCompletedProjects(filteredResults);
          break;
        case 'admin projects':
          renderAdminProjects(filteredResults);
          break;
      }
    }, 300);
  
    // Add event listeners
    [searchInput, filterSelect, sortSelect, dateFrom, dateTo].forEach(element => {
      element.addEventListener('input', debouncedSearch);
    });
  
    // Quick filter buttons
    document.querySelectorAll(`#${inputId}-container .quick-filter`).forEach(button => {
      button.addEventListener('click', () => {
        const days = parseInt(button.dataset.days);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        dateFrom.value = fromDate.toISOString().split('T')[0];
        dateTo.value = new Date().toISOString().split('T')[0];
        addSearchTag(`Last ${days} days`, 'Date Range');
        debouncedSearch();
      });
    });
  }
  
  function filterAndSortResults(searchTerm, filterType, sortType, fromDate, toDate, section) {
    let results = section === 'completed projects' 
      ? projects.filter(p => p.status === 'Completed')
      : projects.filter(p => p.status !== 'Completed');
  
    // Apply search term filter
    if (searchTerm) {
      searchTerm = searchTerm.toLowerCase();
      results = results.filter(project => {
        switch(filterType) {
          case 'name':
            return project.name.toLowerCase().includes(searchTerm);
          case 'po':
            return project.purchaseOrder.toLowerCase().includes(searchTerm);
          case 'part':
            return project.partNumber.toLowerCase().includes(searchTerm);
          case 'job':
            return project.jobNumber.toLowerCase().includes(searchTerm);
          case 'client':
            const client = clients.find(c => c.id === project.clientId);
            return client && client.name.toLowerCase().includes(searchTerm);
          case 'employee':
            return project.assignedEmployees.some(empId => {
              const employee = employees.find(e => e.id === empId);
              return employee && employee.name.toLowerCase().includes(searchTerm);
            });
          case 'all':
          default:
            return (
              project.name.toLowerCase().includes(searchTerm) ||
              project.purchaseOrder.toLowerCase().includes(searchTerm) ||
              project.partNumber.toLowerCase().includes(searchTerm) ||
              project.jobNumber.toLowerCase().includes(searchTerm) ||
              project.notes.toLowerCase().includes(searchTerm)
            );
        }
      });
    }
  
    // Apply date range filter
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      results = results.filter(project => {
        const projectDate = new Date(project.dueDate);
        return projectDate >= from && projectDate <= to;
      });
    }
  
    // Apply sorting
    switch(sortType) {
      case 'newest':
        results.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        results.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'due-date':
        results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        break;
    }
  
    return results;
  }
  
  function setupImprovedSearch() {
    const searchInputs = [
      document.getElementById('project-search-input'),
      document.getElementById('completed-project-search-input'),
      document.getElementById('admin-project-search-input')
    ];

    searchInputs.forEach(searchInput => {
      const recentSearches = JSON.parse(localStorage.getItem(`recentSearches_${searchInput.id}`)) || [];

      // Add the missing setupSearchSuggestions function
      function setupSearchSuggestions() {
        const searchInputs = [
          document.getElementById('project-search-input'),
          document.getElementById('completed-project-search-input'),
          document.getElementById('admin-project-search-input')
        ];
      
        searchInputs.forEach(searchInput => {
          if (!searchInput) return; // Skip if element doesn't exist
          
          const recentSearches = JSON.parse(localStorage.getItem(`recentSearches_${searchInput.id}`)) || [];
          
          // Create datalist for suggestions
          const datalist = document.createElement('datalist');
          datalist.id = `${searchInput.id}-suggestions`;
          searchInput.setAttribute('list', datalist.id);
          searchInput.parentNode.insertBefore(datalist, searchInput.nextSibling);
        });
      }

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
          item.toLowerCase().includes(searchTerm)
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
  
  // Render Operations
  function renderOperations() {
    const operationsList = document.getElementById('operations-list');
    operationsList.innerHTML = '';
    if (Array.isArray(operations)) {
      operations.forEach((operation, index) => {
        const li = document.createElement('li');
        li.textContent = operation;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn-danger');
        deleteBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this operation?')) {
            deleteOperation(index);
          }
        });
        li.appendChild(deleteBtn);
        operationsList.appendChild(li);
      });
    } else {
      console.error('Operations is not an array:', operations);
    }
  }

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
  document.getElementById('add-operation-btn').addEventListener('click', addOperation);

  // Render Employees
  function renderEmployees() {
    const employeesContainer = document.getElementById('employees');
    employeesContainer.innerHTML = '';
  
    employees.forEach((employee) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="employee-name">${employee.name}</span>
        <button class="edit-btn btn-secondary">Edit</button>
        <button class="delete-btn btn-danger">Delete</button>
      `;
  
      const editBtn = li.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => editEmployee(employee));

      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this employee?')) {
          deleteEmployee(employee.id);
        }
      });

      employeesContainer.appendChild(li);
    });
  }

  function editEmployee(employee) {
    document.getElementById('employee-name').value = employee.name;
    employeeModal.style.display = 'block';
  
    saveEmployeeBtn.onclick = function () {
      const updatedName = document.getElementById('employee-name').value.trim();
      if (updatedName) {
        update(ref(db, `employees/${employee.id}`), { name: updatedName })
          .then(() => {
            employee.name = updatedName;
            renderEmployees();
            employeeModal.style.display = 'none';
            employeeForm.reset();
            showNotification('Employee updated successfully', 'success');
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            showNotification('Failed to update employee. Please try again.', 'error');
          });
      } else {
        showNotification('Please enter a valid employee name.', 'warning');
      }
    };
  }

  function deleteEmployee(employeeId) {
    remove(ref(db, `employees/${employeeId}`))
      .then(() => {
        employees = employees.filter(e => e.id !== employeeId);
        projects.forEach((project) => {
          project.assignedEmployees = project.assignedEmployees.filter((id) => id !== employeeId);
          if (project.activeOperations && project.activeOperations[employeeId]) {stopEmployeeOperation(project.id, employeeId);
          }
          update(ref(db, `projects/${project.id}`), project);
        });
        get(ref(db, 'settings/defaultEmployees')).then((snapshot) => {
          if (snapshot.exists()) {
            const defaultEmployees = snapshot.val();
            const updatedDefaultEmployees = defaultEmployees.filter((id) => id !== employeeId);
            update(ref(db, 'settings'), { defaultEmployees: updatedDefaultEmployees });
          }
        });

        renderEmployees();
        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        showNotification('Employee deleted successfully', 'success');
      })
      .catch((error) => {
        console.error("Error deleting employee:", error);
        showNotification('Failed to delete employee. Please try again.', 'error');
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
        <button class="edit-log-btn btn-secondary">Edit</button>
        <button class="view-pause-log-btn btn-secondary">View Pauses</button>
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
            deleteWorkLog(log.id);
          }
        });

// Add the event listener for the edit button:
const editBtn = row.querySelector('.edit-log-btn');
editBtn.addEventListener('click', () => {
    showEditWorkLogModal(log);
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

  // Delete Work Log Entry
  function deleteWorkLog(logId) {
    if (!confirm('Are you sure you want to delete this work log entry?')) {
      return;
    }
  
    remove(ref(db, `workLogs/${logId}`))
      .then(() => {
        // Update local array first
        workLogs = workLogs.filter(log => log.id !== logId);
        
        // Render work logs section
        renderWorkLogs();
        
        // Show success notification
        showNotification('Work log deleted successfully', 'success');
      })
      .catch((error) => {
        console.error('Error deleting work log:', error);
        showNotification('Failed to delete work log', 'error');
      });
  }

// Add this new function for work log editing
function showEditWorkLogModal(log) {
  // Create modal
  const editModal = document.createElement('div');
  editModal.className = 'modal';
  editModal.id = 'edit-work-log-modal';
  editModal.style.display = 'block';

  editModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Work Log Entry</h2>
        <span class="close">&times;</span>
      </div>
      <form id="edit-work-log-form">
        <div class="form-group">
          <label for="edit-log-operation">Operation:</label>
          <select id="edit-log-operation" required>
            ${operations.map(op => 
              `<option value="${op}" ${op === log.operation ? 'selected' : ''}>${op}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="edit-log-employee">Employee:</label>
          <select id="edit-log-employee" required>
            ${employees.map(emp => 
              `<option value="${emp.id}" ${emp.id === log.employeeId ? 'selected' : ''}>${emp.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="edit-log-start">Start Time:</label>
          <input type="datetime-local" id="edit-log-start" 
            value="${new Date(log.startTime).toISOString().slice(0, 16)}" required>
        </div>
        <div class="form-group">
          <label for="edit-log-end">End Time:</label>
          <input type="datetime-local" id="edit-log-end" 
            value="${log.endTime ? new Date(log.endTime).toISOString().slice(0, 16) : ''}"
            ${log.endTime ? 'required' : ''}>
        </div>
        <div class="form-group">
          <label for="edit-log-paused-time">Total Pause Time (minutes):</label>
          <input type="number" id="edit-log-paused-time" 
            value="${Math.floor((log.pausedTime || 0) / 60000)}" min="0">
        </div>
        <div class="button-group">
          <button type="submit" class="btn-primary">Save Changes</button>
          <button type="button" class="btn-secondary cancel-edit">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(editModal);

  // Handle form submission
  const form = editModal.querySelector('#edit-work-log-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startTime = new Date(document.getElementById('edit-log-start').value).getTime();
    const endTimeInput = document.getElementById('edit-log-end').value;
    const endTime = endTimeInput ? new Date(endTimeInput).getTime() : null;
    const pausedTime = parseInt(document.getElementById('edit-log-paused-time').value) * 60000;

    const updatedLog = {
      ...log,
      operation: document.getElementById('edit-log-operation').value,
      employeeId: document.getElementById('edit-log-employee').value,
      employeeName: employees.find(emp => emp.id === document.getElementById('edit-log-employee').value).name,
      startTime,
      endTime,
      pausedTime,
      duration: endTime ? (endTime - startTime - pausedTime) : 0
    };

    try {
      await update(ref(db, `workLogs/${log.id}`), updatedLog);
      
      // Update local array
      const index = workLogs.findIndex(l => l.id === log.id);
      if (index !== -1) {
        workLogs[index] = updatedLog;
      }
      
      // Close only the edit modal
      editModal.remove();
      
      // Render only the work logs section
      renderWorkLogs();
      
      showNotification('Work log updated successfully', 'success');
    } catch (error) {
      console.error('Error updating work log:', error);
      showNotification('Failed to update work log', 'error');
    }
  });

// Add the restoreCompletedProject function
function restoreCompletedProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (project && project.status === 'Completed') {
    update(ref(db, `projects/${projectId}`), { 
      status: 'Not Started'
    })
    .then(() => {
      project.status = 'Not Started';
      renderAll();
      showNotification('Project restored to active projects', 'success');
    })
    .catch(error => {
      console.error('Error restoring project:', error);
      showNotification('Failed to restore project', 'error');
    });
  }
}

// Add the deleteCompletedProject function
function deleteCompletedProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (project && project.status === 'Completed') {
    if (confirm('Are you sure you want to delete this completed project?')) {
      remove(ref(db, `projects/${projectId}`))
      .then(() => {
        // Remove related work logs
        const projectLogs = workLogs.filter(log => log.projectId === projectId);
        const deletePromises = projectLogs.map(log => 
          remove(ref(db, `workLogs/${log.id}`))
        );
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        projects = projects.filter(p => p.id !== projectId);
        workLogs = workLogs.filter(log => log.projectId !== projectId);
        renderAll();
        showNotification('Completed project deleted successfully', 'success');
      })
      .catch(error => {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project', 'error');
      });
    }
  }
}

// Handle close button
const closeBtn = editModal.querySelector('.close');
closeBtn.onclick = () => editModal.remove();

// Handle cancel button
const cancelBtn = editModal.querySelector('.cancel-edit');
cancelBtn.onclick = () => editModal.remove();

// Handle click outside modal
editModal.onclick = (e) => {
  if (e.target === editModal) {
    editModal.remove();
  }
};
}

// Add work log validation
function validateWorkLog(log) {
  const errors = [];

  if (!log.operation) {
      errors.push('Operation is required');
  }

  if (!log.employeeId) {
      errors.push('Employee is required');
  }

  if (!log.startTime) {
      errors.push('Start time is required');
  }

  if (log.endTime && log.endTime < log.startTime) {
      errors.push('End time cannot be before start time');
  }

  if (log.pausedTime < 0) {
      errors.push('Pause time cannot be negative');
  }

  if (log.endTime && log.duration < 0) {
      errors.push('Total duration cannot be negative');
  }

  if (errors.length > 0) {
      throw new Error(errors.join('\n'));
  }

  return true;
}

  // Add this function to update the timer display
  function updateTimerDisplay(projectId, employeeId) {
    const timerDisplay = document.querySelector(
      `.project-card[data-project-id="${projectId}"] .employee-timer[data-employee-id="${employeeId}"] .timer-display`
    );
    if (timerDisplay) {
      const project = projects.find(p => p.id === projectId);
      const timer = project.activeOperations[employeeId];
      const employee = employees.find(e => e.id === employeeId);
      const employeeName = employee ? employee.name : 'Unknown';
      
      get(ref(db, `workLogs/${timer.logEntryId}`)).then((snapshot) => {
        if (snapshot.exists()) {
          const logEntry = snapshot.val();
          let elapsedTime;
          if (timer.isPaused) {
            elapsedTime = timer.pauseStartTime - logEntry.startTime - logEntry.pausedTime;
          } else {
            elapsedTime = Date.now() - logEntry.startTime - logEntry.pausedTime;
          }
          timerDisplay.textContent = `${employeeName} (${timer.operation}): ${formatDuration(elapsedTime)}`;
        }
      });
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
  
  // Add a button or menu item to trigger this function when needed

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

// Enhanced Project Validation
function validateProjectData(projectData) {
  const errors = [];

  if (!projectData.name || projectData.name.trim() === '') {
    errors.push('Project name is required');
  }

  if (projectData.estimatedTime < 0) {
    errors.push('Estimated time cannot be negative');
  }

  // Make these warnings instead of errors
  if (!projectData.clientId) {
    showNotification('Warning: No client selected', 'warning');
  }

  if (!projectData.assignedEmployees || projectData.assignedEmployees.length === 0) {
    showNotification('Warning: No employees assigned', 'warning');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return true;
}

class PersistentTimer {
  constructor(projectId, employeeId) {
    this.projectId = projectId;
    this.employeeId = employeeId;
    this.storageKey = `timer_${projectId}_${employeeId}`;
    this.worker = null;
    this.displayInterval = null;
  }

  start() {
    const startTime = Date.now();
    const timerData = {
      startTime,
      isRunning: true,
      pausedTime: 0,
      lastUpdate: startTime
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(timerData));
    this.startDisplayUpdate();
  }

  startDisplayUpdate() {
    // Clear any existing interval
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
    }
    
    this.displayInterval = setInterval(() => {
      this.updateDisplay();
    }, 1000);
  }

  pause() {
    const timerData = this.getTimerData();
    if (timerData) {
      timerData.isRunning = false;
      timerData.pausedTime += Date.now() - timerData.lastUpdate;
      localStorage.setItem(this.storageKey, JSON.stringify(timerData));
    }
    this.stopDisplayUpdate();
  }

  resume() {
    const timerData = this.getTimerData();
    if (timerData) {
      timerData.isRunning = true;
      timerData.lastUpdate = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(timerData));
      this.startDisplayUpdate();
    }
  }

  stop() {
    localStorage.removeItem(this.storageKey);
    this.stopDisplayUpdate();
  }

  stopDisplayUpdate() {
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
      this.displayInterval = null;
    }
  }

  getTimerData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  updateDisplay() {
    const timerData = this.getTimerData();
    if (!timerData) return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - timerData.startTime - timerData.pausedTime;
    
    const timerDisplay = document.querySelector(
      `.project-card[data-project-id="${this.projectId}"] .employee-timer[data-employee-id="${this.employeeId}"] .timer-display`
    );
    
    if (timerDisplay) {
      const project = projects.find(p => p.id === this.projectId);
      const employee = employees.find(e => e.id === this.employeeId);
      if (project?.activeOperations?.[this.employeeId]) {
        const operation = project.activeOperations[this.employeeId].operation;
        timerDisplay.textContent = `${employee?.name || 'Unknown'}: ${operation} - ${formatDuration(elapsedTime)}`;
      }
    }
  }
}

// Automatic Break Management
function initializeAutomaticBreaks() {
  console.log('Initializing automatic breaks');
  const breaks = settingsSchema.automaticBreaks.length > 0 
    ? settingsSchema.automaticBreaks 
    : DEFAULT_BREAKS;

  breaks.forEach(breakTime => {
    scheduleBreak(breakTime);
  });
}

function scheduleBreak(breakTime) {
  const now = new Date();
  const [startHour, startMinute] = breakTime.start.split(':');
  const [endHour, endMinute] = breakTime.end.split(':');
  
  // Schedule break start
  scheduleBreakTime(parseInt(startHour), parseInt(startMinute), true, breakTime.name);
  // Schedule break end
  scheduleBreakTime(parseInt(endHour), parseInt(endMinute), false, breakTime.name);
}

function scheduleBreakTime(hour, minute, isPause, breakName) {
  const now = new Date();
  let scheduleTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );
  
  // If time has passed, schedule for next day
  if (scheduleTime < now) {
    scheduleTime.setDate(scheduleTime.getDate() + 1);
  }
  
  const timeUntilBreak = scheduleTime.getTime() - now.getTime();
  
  setTimeout(() => {
    handleAutomaticBreak(isPause, breakName);
    // Reschedule for next day
    scheduleBreakTime(hour, minute, isPause, breakName);
  }, timeUntilBreak);
}

function handleAutomaticBreak(isPause, breakName) {
  projects.forEach(project => {
    if (project.activeOperations) {
      Object.keys(project.activeOperations).forEach(employeeId => {
        const operation = project.activeOperations[employeeId];
        if (!operation.isPaused && isPause) {
          // Pause the operation
          pauseResumeEmployeeOperation(project.id, employeeId);
        } else if (operation.isPaused && !isPause) {
          // Resume the operation
          pauseResumeEmployeeOperation(project.id, employeeId);
        }
      });
    }
  });
  
  showNotification(
    isPause 
      ? `${breakName} started - all operations paused` 
      : `${breakName} ended - operations resumed`,
    'info'
  );
}

// Settings UI Update
function renderSettings() {
  const settingsContainer = document.getElementById('settings-container');
  settingsContainer.innerHTML += `
    <div class="settings-section">
      <h3>Project Restrictions</h3>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="restrict-single-project" 
            ${settingsSchema.restrictSingleProject ? 'checked' : ''}>
          Restrict employees to one active project at a time
        </label>
      </div>
      
      <h3>Automatic Breaks</h3>
      <div id="breaks-container">
        ${settingsSchema.automaticBreaks.map((breakTime, index) => `
          <div class="break-time">
            <input type="time" class="break-start" value="${breakTime.start}">
            to
            <input type="time" class="break-end" value="${breakTime.end}">
            <button class="remove-break" data-index="${index}">Remove</button>
          </div>
        `).join('')}
      </div>
      <button id="add-break">Add Break Time</button>
    </div>
    <div class="settings-container">
  <div class="break-settings-section">
    <h3>Automatic Breaks</h3>
    <div class="info-text">Configure automatic breaks when all operations will pause</div>
    <div id="breaks-list"></div>
    <button id="add-break" class="btn-primary">Add New Break</button>
  </div>
</div>
  `;
  
  // Add event listeners for new settings
  document.getElementById('restrict-single-project').addEventListener('change', (e) => {
    settingsSchema.restrictSingleProject = e.target.checked;
    saveSettings();
  });
  
  document.getElementById('add-break').addEventListener('click', addBreakTime);
  
  document.querySelectorAll('.remove-break').forEach(btn => {
    btn.addEventListener('click', () => removeBreakTime(parseInt(btn.dataset.index)));
  });
}

function addBreakTime() {
  settingsSchema.automaticBreaks.push({ start: '12:00', end: '12:30' });
  saveSettings();
  renderSettings();
}

function removeBreakTime(index) {
  settingsSchema.automaticBreaks.splice(index, 1);
  saveSettings();
  renderSettings();
}

  // Initial renders
  renderProjects();
  renderCompletedProjects();
  renderAdminProjects();
  renderEmployees();
  renderWorkLogs();
  renderClients();
  renderOperations();

  function handleWorkLogFormSubmit(log, form) {
    const startTime = new Date(form.querySelector('#edit-log-start').value).getTime();
    const endTimeInput = form.querySelector('#edit-log-end').value;
    const endTime = endTimeInput ? new Date(endTimeInput).getTime() : null;
    const pausedTime = parseInt(form.querySelector('#edit-log-paused-time').value) * 60000;

    const updatedLog = {
      ...log,
      operation: form.querySelector('#edit-log-operation').value,
      employeeId: form.querySelector('#edit-log-employee').value,
      employeeName: employees.find(emp => emp.id === form.querySelector('#edit-log-employee').value).name,
      startTime,
      endTime,
      pausedTime,
      duration: endTime ? (endTime - startTime - pausedTime) : 0
    };

    return update(ref(db, `workLogs/${log.id}`), updatedLog)
      .then(() => {
        const index = workLogs.findIndex(l => l.id === log.id);
        workLogs[index] = updatedLog;
        renderWorkLogs();
        showNotification('Work log updated successfully', 'success');
      });
  }

  function updateProjectStatus(projectId, newStatus) {
    return update(ref(db, `projects/${projectId}`), { status: newStatus })
      .then(() => {
        // Update local array
        const project = projects.find(p => p.id === projectId);
        if (project) {
          project.status = newStatus;
        }
        
        // Render all views
        renderProjects();
        renderCompletedProjects();
        renderAdminProjects();
        
        return true;
      })
      .catch((error) => {
        console.error('Error updating project status:', error);
        throw error;
      });
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

  window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine:', lineNo, '\nColumn:', columnNo, '\nError object:', error);
    showNotification('An error occurred. Please check the console.', 'error');
    return false;
  };
 
  function autoBackup() {
    const backup = {
      timestamp: Date.now(),
      data: {
        projects,
        employees,
        operations,
        workLogs,
        clients
      }
    };
    localStorage.setItem('autoBackup', JSON.stringify(backup));
  }

  function checkRequiredElements() {
    const requiredElements = {
      'project-name': 'Project Name input',
      'project-employees': 'Employee Selection',
      'project-client': 'Client Selection',
      'project-priority': 'Priority Selection',
      'project-form': 'Project Form',
      'project-search-input': 'Project search input',
    'completed-project-search-input': 'Completed project search input',
    'admin-project-search-input': 'Admin project search input',
    'add-operation-btn': 'Add operation button',
    };
  
    for (const [id, name] of Object.entries(requiredElements)) {
      if (!document.getElementById(id)) {
        console.error(`Required element missing: ${name} (id: ${id})`);
        showNotification(`Error: ${name} element not found`, 'error');
        return false;
      }
    }
    return true;
  }
  const missingElements = [];
  for (const [id, name] of Object.entries(requiredElements)) {
    if (!document.getElementById(id)) {
      missingElements.push(name);
    }
  }

  if (missingElements.length > 0) {
    console.error('Missing required elements:', missingElements);
    showNotification('Some UI elements are missing. Please check the console.', 'error');
    return;
  }
  
  // Add this check before opening the project modal
  addProjectBtn.addEventListener('click', () => {
    if (!checkRequiredElements()) return;
    
    console.log('Add project button clicked');
    loadEmployeesToSelect(document.getElementById('project-employees'));
    loadClientsToSelect(document.getElementById('project-client'));
    // ... rest of the code
  });

  function safeRender(renderFunc, name) {
    try {
      renderFunc();
    } catch (error) {
      console.error(`Error rendering ${name}:`, error);
      showNotification(`Failed to render ${name}. Please refresh the page.`, 'error');
    }
  }
  
  function renderAll() {
    if (document.getElementById('projects')) {
      safeRender(() => renderProjects(), 'projects');
    }
    if (document.getElementById('completed-projects-container')) {
      safeRender(() => renderCompletedProjects(), 'completed projects');
    }
    // etc...
  }

  document.getElementById('add-break').addEventListener('click', addBreakTime);

  function initializeAutomaticBreaks() {
    console.log('Initializing automatic breaks');
    const breaks = settingsSchema.automaticBreaks.length > 0 
      ? settingsSchema.automaticBreaks 
      : DEFAULT_BREAKS;
  
    // Clear any existing scheduled breaks
    if (window.scheduledBreaks) {
      window.scheduledBreaks.forEach(timeoutId => clearTimeout(timeoutId));
    }
    window.scheduledBreaks = [];
  
    breaks.forEach(breakTime => {
      scheduleBreak(breakTime);
    });
  }  

  function scheduleBreak(breakTime) {
    const now = new Date();
    const [startHour, startMinute] = breakTime.start.split(':').map(Number);
    const [endHour, endMinute] = breakTime.end.split(':').map(Number);
    
    // Schedule break start
    scheduleBreakTime(startHour, startMinute, true, breakTime.name);
    // Schedule break end
    scheduleBreakTime(endHour, endMinute, false, breakTime.name);
  }
  
  function scheduleBreakTime(hour, minute, isPause, breakName) {
    const now = new Date();
    let scheduleTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute
    );
    
    // If time has passed, schedule for next day
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    const timeUntilBreak = scheduleTime.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      handleAutomaticBreak(isPause, breakName);
      // Reschedule for next day
      scheduleBreakTime(hour, minute, isPause, breakName);
    }, timeUntilBreak);
  
    // Keep track of scheduled timeouts to clear them if needed
    window.scheduledBreaks.push(timeoutId);
  }  

  function handleAutomaticBreak(isPause, breakName) {
    projects.forEach(project => {
      if (project.activeOperations) {
        Object.keys(project.activeOperations).forEach(employeeId => {
          const operation = project.activeOperations[employeeId];
          if (isPause && !operation.isPaused) {
            // Pause the operation
            pauseResumeEmployeeOperation(project.id, employeeId);
          } else if (!isPause && operation.isPaused) {
            // Resume the operation
            pauseResumeEmployeeOperation(project.id, employeeId);
          }
        });
      }
    });
    
    showNotification(
      isPause 
        ? `${breakName} started - all operations paused` 
        : `${breakName} ended - operations resumed`,
      'info'
    );
  }  
  
  // Run backup every 5 minutes
  setInterval(autoBackup, 300000);

  // Initialize your app
  loadData().catch(error => {
    console.error("Error loading data:", error);
    showNotification('Failed to load data', 'error');
  });

});// End of DOMContentLoaded event listener
