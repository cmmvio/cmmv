const useDataTable = () => {
    const { ref, reactive, computed, watch, onMounted, toRefs } = Vue;

    // State
    const state = reactive({
        records: [],
        loading: false,
        error: null,
        currentPage: 1,
        pageSize: 10,
        totalRecords: 0,
        totalPages: 1,
        sortBy: 'id',
        sortDirection: 'desc',
        searchTerm: '',
        searchDebounce: null,
        baseUrl: window.location.origin,
        contract: null,
        fields: [],
        viewModalOpen: false,
        editModalOpen: false,
        deleteModalOpen: false,
        selectedRecord: null,
        editingRecord: null,
        isCreating: false,
        saving: false,
        deleting: false,
        recordToDelete: null,
        anyRequiredFieldEmpty: false,
        importModalOpen: false,
        importData: '',
        importError: null,
        importing: false,
        importOptions: {
            clearExisting: false,
            skipErrors: true
        },
        estimatedImportCount: 0,
        validationErrors: [],
        importProgress: {
            show: false,
            total: 0,
            current: 0,
            success: 0,
            failed: 0
        },
        searchField: ''
    });

    // Add a specific ref just for records to ensure reactivity
    const recordsRef = ref([]);

    // Computed properties
    const visibleFields = computed(() => {
        if (!state.fields || state.fields.length === 0) return [];

        // Filter out fields that shouldn't be displayed in the table
        return state.fields.filter(field => {
            // Ensure field is defined and has propertyKey
            if (!field || !field.propertyKey) {
                return false;
            }

            // Skip internal fields or fields with custom display rules
            const skip = ['deletedBy', 'deleted'];
            return !skip.includes(field.propertyKey);
        });
    });

    const editableFields = computed(() => {
        if (!state.fields || state.fields.length === 0) return [];

        // Filter out fields that shouldn't be editable
        return state.fields.filter(field => {
            // Skip read-only and system fields
            const skip = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'createdBy', 'updatedBy', 'deletedBy', 'deleted'];
            return !skip.includes(field.propertyKey) && !field.readOnly;
        });
    });

    const isValidImportData = computed(() => {
        if (!state.importData || state.importData.trim() === '') {
            return false;
        }

        try {
            const data = (new Function('return ' + state.importData))();

            // Check if it's an array or has a data array property
            const recordsArray = Array.isArray(data) ? data : (data.data || data.records || data.items || []);

            if (!Array.isArray(recordsArray) || recordsArray.length === 0) {
                return false;
            }

            // Update the estimated count for the UI
            state.estimatedImportCount = recordsArray.length;

            // Validate required fields
            validateImportData(recordsArray);

            // Valid if no validation errors
            return state.validationErrors.length === 0;
        } catch (e) {
            console.log(e)
            state.estimatedImportCount = 0;
            state.validationErrors = [`Invalid JSON format: ${e.message}`];
            return false;
        }
    });

    const searchableFields = computed(() => {
        if (!state.fields || state.fields.length === 0) return [];

        // Filter out fields that aren't searchable
        // Generally we want to exclude complex types like objects, arrays
        return state.fields.filter(field => {
            if (!field || !field.propertyKey) {
                return false;
            }

            // Skip fields that aren't easily searchable
            const skipTypes = ['json', 'object', 'array', 'map'];
            return !skipTypes.includes(field.protoType);
        });
    });

    // Helper function to get auth headers from localStorage
    function getAuthHeaders() {
        const headers = {};

        try {
            // Get auth data from localStorage (same as API Explorer)
            const storedAuth = localStorage.getItem('apiExplorerAuth');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData && authData.token) {
                    headers['Authorization'] = `Bearer ${authData.token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth headers:', error);
        }

        return headers;
    }

    // Add new functions for state persistence

    // Generate a unique key for storing state for this specific contract
    function getStateStorageKey() {
        if (!state.contract || !state.contract.contractName) {
            return null;
        }
        return `datatable_state_${state.contract.contractName}`;
    }

    // Save the current state to localStorage
    function saveStateToLocalStorage() {
        const key = getStateStorageKey();
        if (!key) return;

        const stateToSave = {
            currentPage: state.currentPage,
            pageSize: state.pageSize,
            sortBy: state.sortBy,
            sortDirection: state.sortDirection,
            searchTerm: state.searchTerm,
            searchField: state.searchField
        };

        try {
            localStorage.setItem(key, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state to localStorage:', error);
        }
    }

    // Load state from localStorage
    function loadStateFromLocalStorage() {
        const key = getStateStorageKey();
        if (!key) return false;

        try {
            const savedState = localStorage.getItem(key);
            if (!savedState) return false;

            const parsedState = JSON.parse(savedState);

            // Apply saved state
            if (parsedState.currentPage) state.currentPage = parsedState.currentPage;
            if (parsedState.pageSize) state.pageSize = parsedState.pageSize;
            if (parsedState.sortBy) state.sortBy = parsedState.sortBy;
            if (parsedState.sortDirection) state.sortDirection = parsedState.sortDirection;
            if (parsedState.searchTerm !== undefined) state.searchTerm = parsedState.searchTerm;
            if (parsedState.searchField !== undefined) state.searchField = parsedState.searchField;

            return true;
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
            return false;
        }
    }

    // Methods
    async function initialize(contract) {
        state.contract = contract;
        state.fields = contract.fields || [];

        // Try to load saved state
        const hasLoadedState = loadStateFromLocalStorage();

        // If we didn't load state, set defaults
        if (!hasLoadedState) {
            // Default sort by createdAt if available, otherwise id
            if (state.fields.some(f => f.propertyKey === 'createdAt')) {
                state.sortBy = 'createdAt';
            } else if (state.fields.some(f => f.propertyKey === 'id')) {
                state.sortBy = 'id';
            } else if (state.fields.length > 0) {
                state.sortBy = state.fields[0].propertyKey;
            }

            // Reset pagination
            state.currentPage = 1;
            state.totalPages = 1;
        }

        // Load initial data
        await fetchData();
    }

    async function fetchData() {
        if (!state.contract) return;

        try {
            state.loading = true;
            state.error = null;

            // Build the endpoint URL - use the controller name
            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            // Calculate offset for pagination
            const offset = (state.currentPage - 1) * state.pageSize;

            // Build query parameters
            const queryParams = new URLSearchParams({
                limit: state.pageSize,
                offset: offset,
                sortBy: state.sortBy,
                sort: state.sortDirection,
            });

            // Add search term and field if provided
            if (state.searchTerm) {
                queryParams.append('search', state.searchTerm);

                // Only add searchField if it's selected (not empty)
                if (state.searchField) {
                    queryParams.append('searchField', state.searchField);
                }
            }

            // Fetch data with pagination and sorting
            const url = `${state.baseUrl}/${endpoint}?${queryParams.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }

            const data = await response.json();

            // Debug the response structure
            console.log('API Response:', data);
            console.log('Response format:', data.result && Array.isArray(data.result.data) ? 'result.data array'
                                          : data.result && data.result.items ? 'result.items object'
                                          : Array.isArray(data.result) ? 'result array'
                                          : Array.isArray(data) ? 'direct array'
                                          : 'unknown format');

            // Check for the specific response format from your API
            if (data.status === 200 && data.result && data.result.data && Array.isArray(data.result.data)) {
                state.records = data.result.data;
                state.totalRecords = data.result.count || 0;
                console.log(`API response processed: ${state.records.length} records, total: ${state.totalRecords}`);
            }
            // Then continue with the existing format checks as fallbacks
            else if (data.result && data.result.data && Array.isArray(data.result.data)) {
                // Format: { result: { data: [], total: number } }
                state.records = data.result.data;
                state.totalRecords = data.result.total || data.result.count || data.result.data.length;
                console.log(`Assigned ${state.records.length} records from result.data`);
            } else if (data.result && data.result.items) {
                // Format: { result: { items: [], total: number } }
                state.records = data.result.items || [];
                state.totalRecords = data.result.total || state.records.length;
                console.log(`Assigned ${state.records.length} records from result.items`);
            } else if (data.result && Array.isArray(data.result)) {
                // Format: { result: [] }
                state.records = data.result;
                state.totalRecords = data.result.length;
                console.log(`Assigned ${state.records.length} records from result array`);
            } else if (Array.isArray(data)) {
                // Format: []
                state.records = data;
                state.totalRecords = data.length;
                console.log(`Assigned ${state.records.length} records from direct array`);
            } else {
                // Try to extract records from other formats
                const possibleRecords = data.data || data.items || data.records || data.result;
                if (possibleRecords && Array.isArray(possibleRecords)) {
                    state.records = possibleRecords;
                    state.totalRecords = data.total || possibleRecords.length;
                    console.log(`Assigned ${state.records.length} records from detected property`);
                } else {
                    state.records = [];
                    state.totalRecords = 0;
                    console.log('No records found in response');
                }
            }

            // After processing API response, make sure to validate records
            if (Array.isArray(state.records)) {
                // Filter out any undefined/null records
                state.records = state.records.filter(record => record != null);

                // Make sure each record has an id field if missing
                state.records.forEach((record, index) => {
                    if (!record.id) {
                        record.id = `record-${index}`;
                    }
                });
            } else {
                // Ensure records is always a valid array
                state.records = [];
            }

            // Calculate total pages
            state.totalPages = Math.max(1, Math.ceil(state.totalRecords / state.pageSize));

            // Adjust current page if it's out of bounds
            if (state.currentPage > state.totalPages) {
                state.currentPage = state.totalPages;
                await fetchData(); // Refetch with corrected page
            }

            // After processing all format conditions, add this debug code:
            console.log('Final records assignment:', {
                recordsLength: state.records.length,
                firstRecord: state.records[0] ? Object.keys(state.records[0]) : 'No records',
                totalRecords: state.totalRecords,
                isArray: Array.isArray(state.records)
            });

            // Ensure records are definitely assigned to both state and our ref
            state.records = [...state.records]; // Create a new array to trigger reactivity
            recordsRef.value = [...state.records]; // Also update the ref

        } catch (error) {
            console.error('Error fetching data:', error);
            state.error = error.message;
            state.records = [];
        } finally {
            state.loading = false;
        }
    }

    function refreshData(createMode = false) {
        if (createMode) {
            openCreateForm();
        } else {
            fetchData();
        }
    }

    // Pagination methods
    function goToPage(page) {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        saveStateToLocalStorage(); // Save state after change
        fetchData();
    }

    function goToFirstPage() {
        goToPage(1);
    }

    function goToLastPage() {
        goToPage(state.totalPages);
    }

    function goToNextPage() {
        goToPage(state.currentPage + 1);
    }

    function goToPreviousPage() {
        goToPage(state.currentPage - 1);
    }

    function handlePageInputChange(event) {
        const page = parseInt(event.target.value, 10);
        if (!isNaN(page)) {
            // Ensure page is within bounds
            const validPage = Math.min(Math.max(1, page), state.totalPages);
            state.currentPage = validPage;
            saveStateToLocalStorage(); // Save state after change
            fetchData();
        }
    }

    function handlePageSizeChange() {
        state.currentPage = 1; // Reset to first page when changing page size
        saveStateToLocalStorage(); // Save state after change
        fetchData();
    }

    // Sorting methods
    function toggleSort(field) {
        if (state.sortBy === field) {
            // Toggle direction if already sorting by this field
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new sort field and default to ascending
            state.sortBy = field;
            state.sortDirection = 'asc';
        }
        state.currentPage = 1; // Reset to first page when changing sort
        saveStateToLocalStorage(); // Save state after change
        fetchData();
    }

    // Search methods
    function handleSearchInput() {
        // Debounce search to avoid excessive API calls
        if (state.searchDebounce) {
            clearTimeout(state.searchDebounce);
        }

        state.searchDebounce = setTimeout(() => {
            state.currentPage = 1; // Reset to first page when searching
            saveStateToLocalStorage(); // Save state after change
            fetchData();
        }, 300);
    }

    // Record viewing methods
    function viewRecord(record) {
        state.selectedRecord = { ...record };
        state.viewModalOpen = true;
    }

    function closeViewModal() {
        state.viewModalOpen = false;
        state.selectedRecord = null;
    }

    // Record editing methods
    function editRecord(record) {
        state.isCreating = false;

        // Create a copy of the record for editing
        state.editingRecord = {
            ...record,
            // Store raw JSON strings to edit JSON fields
            _raw: {}
        };

        // Initialize raw JSON fields
        state.fields.forEach(field => {
            if (field.protoType === 'json' && record[field.propertyKey]) {
                try {
                    state.editingRecord._raw[field.propertyKey] =
                        typeof record[field.propertyKey] === 'string'
                            ? record[field.propertyKey]
                            : JSON.stringify(record[field.propertyKey], null, 2);
                } catch (e) {
                    state.editingRecord._raw[field.propertyKey] = '{}';
                }
            }
        });

        state.editModalOpen = true;

        // After setting up the record, check required fields
        checkRequiredFields();
    }

    function openCreateForm() {
        state.isCreating = true;

        // Create new empty record
        state.editingRecord = {
            _raw: {}
        };

        // Initialize default values based on field types
        editableFields.value.forEach(field => {
            if (field.protoType === 'boolean' || field.protoType === 'bool') {
                state.editingRecord[field.propertyKey] = false;
            } else if (['int32', 'int64', 'float', 'double', 'number', 'bigint'].includes(field.protoType)) {
                state.editingRecord[field.propertyKey] = 0;
            } else if (field.protoType === 'json') {
                state.editingRecord[field.propertyKey] = {};
                state.editingRecord._raw[field.propertyKey] = '{}';
            } else if (field.protoType === 'date') {
                state.editingRecord[field.propertyKey] = new Date().toISOString().split('T')[0];
            } else if (field.protoType === 'timestamp') {
                state.editingRecord[field.propertyKey] = new Date().toISOString();
            } else {
                state.editingRecord[field.propertyKey] = '';
            }
        });

        state.editModalOpen = true;

        // After setting up the record, check required fields
        checkRequiredFields();
    }

    function closeEditModal() {
        state.editModalOpen = false;
        state.editingRecord = null;
        state.isCreating = false;
        state.saving = false;
    }

    function handleJsonFieldChange(fieldKey) {
        try {
            // Parse JSON string to update the actual field value
            const jsonValue = JSON.parse(state.editingRecord._raw[fieldKey]);
            state.editingRecord[fieldKey] = jsonValue;
        } catch (e) {
            // If parsing fails, keep the raw value but don't update the object
            console.warn(`Invalid JSON for field ${fieldKey}`);
        }
    }

    async function saveRecord() {
        if (!state.editingRecord) return;

        try {
            state.saving = true;

            // Remove internal properties before sending
            const recordToSave = { ...state.editingRecord };
            delete recordToSave._raw;

            // Build endpoint URL
            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            // Determine if creating or updating
            const method = state.isCreating ? 'POST' : 'PUT';
            const url = state.isCreating
                ? `${state.baseUrl}/${endpoint}`
                : `${state.baseUrl}/${endpoint}/${recordToSave.id}`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(recordToSave)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${state.isCreating ? 'creating' : 'updating'} record`);
            }

            // Refresh data
            await fetchData();

            // Close modal
            closeEditModal();

        } catch (error) {
            console.error('Error saving record:', error);
            alert(`Error ${state.isCreating ? 'creating' : 'updating'} record: ${error.message}`);
        } finally {
            state.saving = false;
        }
    }

    // Record deletion methods
    function deleteRecord(record) {
        state.recordToDelete = record;
        state.deleteModalOpen = true;
    }

    function closeDeleteModal() {
        state.deleteModalOpen = false;
        state.recordToDelete = null;
        state.deleting = false;
    }

    async function confirmDelete() {
        if (!state.recordToDelete) return;

        try {
            state.deleting = true;

            // Build endpoint URL
            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            const url = `${state.baseUrl}/${endpoint}/${state.recordToDelete.id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error deleting record');
            }

            // Refresh data
            await fetchData();

            // Close modal
            closeDeleteModal();

        } catch (error) {
            console.error('Error deleting record:', error);
            alert(`Error deleting record: ${error.message}`);
        } finally {
            state.deleting = false;
        }
    }

    // Add these methods to handle required fields validation
    function isRequiredField(field) {
        if (!field) return false;

        // Check for nullable:false or required:true
        return field.nullable === false || field.required === true;
    }

    function checkRequiredFields() {
        if (!state.editingRecord) {
            state.anyRequiredFieldEmpty = false;
            return;
        }

        // Get all required fields
        const requiredFields = editableFields.value.filter(isRequiredField);

        // Check if any required field is empty
        state.anyRequiredFieldEmpty = requiredFields.some(field => {
            if (!field || !field.propertyKey) return false;

            const value = state.editingRecord[field.propertyKey];

            if (field.protoType === 'json') {
                // For JSON fields, check the _raw value
                try {
                    const rawValue = state.editingRecord._raw[field.propertyKey];
                    return !rawValue || rawValue.trim() === '' || rawValue === '{}';
                } catch (e) {
                    return true; // Consider invalid as empty
                }
            }

            // For other field types
            return value === undefined || value === null || value === '';
        });
    }

    // Initialize if contract is provided
    function init(contract) {
        if (contract) {
            initialize(contract);
        }
    }

    // Add these methods to handle the import functionality
    function openImportModal() {
        state.importModalOpen = true;
        state.importData = '';
        state.importError = null;
        state.importing = false;
        state.estimatedImportCount = 0;
        state.validationErrors = [];
        state.importProgress = {
            show: false,
            total: 0,
            current: 0,
            success: 0,
            failed: 0
        };
    }

    function closeImportModal() {
        state.importModalOpen = false;
        state.importData = '';
        state.importError = null;
        state.importing = false;
        state.validationErrors = [];
        state.importProgress.show = false;
    }

    function formatImportData() {
        if (!state.importData) return;

        try {
            const data = (new Function('return ' + state.importData))();
            state.importData = JSON.stringify(data, null, 4);

            // Check validation after formatting
            isValidImportData.value;
        } catch (e) {
            state.importError = 'Invalid JSON format';
            state.validationErrors = [`Invalid JSON format: ${e.message}`];
        }
    }

    async function importRecords() {
        if (!state.contract || !isValidImportData.value) {
            return;
        }

        try {
            state.importing = true;
            state.importError = null;

            // Parse the data
            let data = (new Function('return ' + state.importData))();

            // If the data isn't an array, look for common array properties
            if (!Array.isArray(data)) {
                data = data.data || data.records || data.items || [];
            }

            // Set up progress tracking
            state.importProgress = {
                show: true,
                total: data.length,
                current: 0,
                success: 0,
                failed: 0
            };

            // Build the endpoint URL for individual inserts
            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();
            const url = `${state.baseUrl}/${endpoint}`;

            // If clearExisting is true, clear existing data
            if (state.importOptions.clearExisting) {
                // A simple approach: just reset and fetch after import
                // For a more robust solution, you'd implement a proper clear endpoint
            }

            // Process records individually
            for (let i = 0; i < data.length; i++) {
                const record = data[i];

                try {
                    // Send the individual record
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify(record)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to import record');
                    }

                    // Record success
                    state.importProgress.success++;
                } catch (error) {
                    console.error(`Error importing record ${i + 1}:`, error);
                    state.importProgress.failed++;

                    // If not skipping errors, break the loop
                    if (!state.importOptions.skipErrors) {
                        state.importError = `Error importing record ${i + 1}: ${error.message}`;
                        break;
                    }
                }

                // Update progress counter
                state.importProgress.current = i + 1;
            }

            // Show completion message
            if (state.importProgress.failed === 0) {
                alert(`Successfully imported ${state.importProgress.success} records.`);
                closeImportModal();
            } else {
                state.importError = `Import completed with ${state.importProgress.failed} errors.`;
            }

            // Refresh data to show the imported records
            await fetchData();

        } catch (error) {
            console.error('Error importing data:', error);
            state.importError = error.message || 'Failed to import data';
        } finally {
            state.importing = false;
        }
    }

    // Add this new method to validate import data
    function validateImportData(records) {
        state.validationErrors = [];

        if (!records || records.length === 0) {
            state.validationErrors.push('No records to import');
            return;
        }

        // Get required fields
        const requiredFields = state.fields.filter(field =>
            field && field.propertyKey && (field.nullable === false || field.required === true)
        );

        // Skip validation if no required fields
        if (requiredFields.length === 0) {
            return;
        }

        // Check each record for required fields
        records.forEach((record, index) => {
            requiredFields.forEach(field => {
                if (field && field.propertyKey) {
                    const value = record[field.propertyKey];

                    if (value === undefined || value === null || value === '') {
                        state.validationErrors.push(
                            `Record #${index + 1}: Missing required field "${field.propertyKey}"`
                        );
                    }
                }
            });
        });
    }

    // Add handler for search field changes
    function handleSearchFieldChange() {
        // Reset to first page when changing search field
        state.currentPage = 1;
        saveStateToLocalStorage();
        fetchData();
    }

    // Expose state and methods
    return {
        // Use toRefs to ensure reactivity of state properties
        ...toRefs(state),

        // Make sure records is explicitly returned with the ref value
        records: recordsRef,

        // Computed properties
        visibleFields,
        editableFields,
        isValidImportData,
        searchableFields,

        // Methods
        initialize,
        refreshData,
        fetchData,

        // Pagination
        goToFirstPage,
        goToLastPage,
        goToNextPage,
        goToPreviousPage,
        handlePageInputChange,
        handlePageSizeChange,

        // Sorting
        toggleSort,

        // Search
        handleSearchInput,
        handleSearchFieldChange,

        // Record operations
        viewRecord,
        closeViewModal,
        editRecord,
        openCreateForm,
        closeEditModal,
        handleJsonFieldChange,
        saveRecord,
        deleteRecord,
        closeDeleteModal,
        confirmDelete,

        // Initialization
        init,

        // New methods
        isRequiredField,
        checkRequiredFields,
        openImportModal,
        closeImportModal,
        formatImportData,
        importRecords
    };
};

// This allows the composable to be used in the main client.cjs file
if (typeof window !== 'undefined') {
    window.useDataTable = useDataTable;
}
