const useDataTable = () => {
    const { ref, reactive, computed, watch, onMounted, toRefs } = Vue;

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
        searchField: '',
        linkedEntities: {},
        loadingLinks: {},
        schema: null
    });

    const recordsRef = ref([]);

    const visibleFields = computed(() => {
        if (!state.fields || state.fields.length === 0) return [];

        return state.fields.filter(field => {
            if (!field || !field.propertyKey) {
                return false;
            }

            const skip = ['deletedBy', 'deleted'];
            return !skip.includes(field.propertyKey);
        });
    });

    const editableFields = computed(() => {
        if (!state.fields || state.fields.length === 0) return [];

        return state.fields.filter(field => {
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

            const recordsArray = Array.isArray(data) ? data : (data.data || data.records || data.items || []);

            if (!Array.isArray(recordsArray) || recordsArray.length === 0) {
                return false;
            }

            state.estimatedImportCount = recordsArray.length;

            validateImportData(recordsArray);

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

        return state.fields.filter(field => {
            if (!field || !field.propertyKey) {
                return false;
            }

            const skipTypes = ['json', 'object', 'array', 'map'];
            return !skipTypes.includes(field.protoType);
        });
    });

    let authErrorHandler = null;

    function setAuthErrorHandler(handler) {
        authErrorHandler = handler;
    }

    function getAuthToken() {
        const storedAuth = localStorage.getItem('apiExplorerAuth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                return auth.token ? `Bearer ${auth.token}` : '';
            } catch (e) {
                return '';
            }
        }
        return '';
    }

    function getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = token;
        }

        return headers;
    }

    function getStateStorageKey() {
        if (!state.contract || !state.contract.contractName) {
            return null;
        }
        return `datatable_state_${state.contract.contractName}`;
    }

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
            console.error(error);
        }
    }

    function loadStateFromLocalStorage() {
        const key = getStateStorageKey();
        if (!key) return false;

        try {
            const savedState = localStorage.getItem(key);
            if (!savedState) return false;

            const parsedState = JSON.parse(savedState);

            if (parsedState.currentPage) state.currentPage = parsedState.currentPage;
            if (parsedState.pageSize) state.pageSize = parsedState.pageSize;
            if (parsedState.sortBy) state.sortBy = parsedState.sortBy;
            if (parsedState.sortDirection) state.sortDirection = parsedState.sortDirection;
            if (parsedState.searchTerm !== undefined) state.searchTerm = parsedState.searchTerm;
            if (parsedState.searchField !== undefined) state.searchField = parsedState.searchField;

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function initialize(contract, schema) {
        state.contract = contract;
        state.fields = contract.fields || [];
        state.schema = schema;

        const hasLoadedState = loadStateFromLocalStorage();

        if (!hasLoadedState) {
            if (state.fields.some(f => f.propertyKey === 'createdAt')) {
                state.sortBy = 'createdAt';
            } else if (state.fields.some(f => f.propertyKey === 'id')) {
                state.sortBy = 'id';
            } else if (state.fields.length > 0) {
                state.sortBy = state.fields[0].propertyKey;
            }

            state.currentPage = 1;
            state.totalPages = 1;
        }

        await initLinkedEntities();

        // Get the auth token and check if we should fetch data
        const authToken = getAuthToken();

        if (authToken) {
            await fetchData();
        } else {
            state.error = "Authentication required: Please log in to access data";
            state.records = [];

            // Call auth error handler if provided
            if (authErrorHandler && typeof authErrorHandler === 'function') {
                authErrorHandler();
            }
        }
    }

    async function fetchData() {
        if (!state.contract) return;

        try {
            // Get the auth token and check authentication first
            const authToken = getAuthToken();

            // Only attempt to fetch data if we have a token
            if (!authToken) {
                state.error = "Authentication required: Please log in to access data";
                state.records = [];
                state.totalRecords = 0;
                state.totalPages = 1;
                state.loading = false;

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            state.loading = true;
            state.error = null;

            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            const offset = (state.currentPage - 1) * state.pageSize;

            const queryParams = new URLSearchParams({
                limit: state.pageSize,
                offset: offset,
                sortBy: state.sortBy,
                sort: state.sortDirection,
            });

            if (state.searchTerm) {
                queryParams.append('search', state.searchTerm);

                if (state.searchField) {
                    queryParams.append('searchField', state.searchField);
                }
            }

            const url = `${state.baseUrl}/${endpoint}?${queryParams.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Authentication required to access data";
                state.records = [];
                state.totalRecords = 0;
                state.totalPages = 1;

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 200 && data.result && data.result.data && Array.isArray(data.result.data)) {
                state.records = data.result.data;
                state.totalRecords = data.result.count || 0;
            }
            else if (data.result && data.result.data && Array.isArray(data.result.data)) {
                state.records = data.result.data;
                state.totalRecords = data.result.total || data.result.count || data.result.data.length;
            } else if (data.result && data.result.items) {
                state.records = data.result.items || [];
                state.totalRecords = data.result.total || state.records.length;
            } else if (data.result && Array.isArray(data.result)) {
                state.records = data.result;
                state.totalRecords = data.result.length;
            } else if (Array.isArray(data)) {
                state.records = data;
                state.totalRecords = data.length;
            } else {
                const possibleRecords = data.data || data.items || data.records || data.result;
                if (possibleRecords && Array.isArray(possibleRecords)) {
                    state.records = possibleRecords;
                    state.totalRecords = data.total || possibleRecords.length;
                } else {
                    state.records = [];
                    state.totalRecords = 0;
                }
            }

            if (Array.isArray(state.records)) {
                state.records = state.records.filter(record => record != null);

                state.records.forEach((record, index) => {
                    if (!record.id) {
                        record.id = `record-${index}`;
                    }
                });
            } else {
                state.records = [];
            }

            state.totalPages = Math.max(1, Math.ceil(state.totalRecords / state.pageSize));

            if (state.currentPage > state.totalPages) {
                state.currentPage = state.totalPages;
                await fetchData();
            }

            state.records = [...state.records];
            recordsRef.value = [...state.records];

            if (Array.isArray(state.records) && state.records.length > 0) {
                const linkFields = state.fields.filter(field => isLinkField(field));

                for (const field of linkFields) {
                    const entityName = getEntityNameFromField(field);
                    if (!state.linkedEntities[entityName]) {
                        try {
                            await fetchLinkedEntityRecords(field, getContractNameFromField(field));
                        } catch (error) {}
                    }
                }
            }
        } catch (error) {
            console.error(error);
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

    function goToPage(page) {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        saveStateToLocalStorage();
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
            const validPage = Math.min(Math.max(1, page), state.totalPages);
            state.currentPage = validPage;
            saveStateToLocalStorage();
            fetchData();
        }
    }

    function handlePageSizeChange() {
        state.currentPage = 1;
        saveStateToLocalStorage();
        fetchData();
    }

    function toggleSort(field) {
        if (state.sortBy === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortBy = field;
            state.sortDirection = 'asc';
        }
        state.currentPage = 1;
        saveStateToLocalStorage();
        fetchData();
    }

    function handleSearchInput() {
        if (state.searchDebounce) {
            clearTimeout(state.searchDebounce);
        }

        state.searchDebounce = setTimeout(() => {
            state.currentPage = 1;
            saveStateToLocalStorage();
            fetchData();
        }, 300);
    }

    async function viewRecord(record) {
        state.selectedRecord = { ...record, _links: {} };

        for (const field of state.fields) {
            if (isLinkField(field) && field.propertyKey && record[field.propertyKey]) {
                const entityName = getEntityNameFromField(field);

                if (!state.linkedEntities[entityName]) {
                    try {
                        await fetchLinkedEntityRecords(field, state.contract.contractName);
                    } catch (err) {
                        console.warn(err);
                    }
                }

                if (state.linkedEntities[entityName]) {
                    const linkedRecord = state.linkedEntities[entityName].find(
                        item => item.id === record[field.propertyKey]
                    );

                    if (linkedRecord) {
                        state.selectedRecord._links[field.propertyKey] = {
                            id: linkedRecord.id,
                            display: getDisplayField(linkedRecord),
                            entity: entityName
                        };
                    }
                }
            }
        }

        state.viewModalOpen = true;
    }

    function closeViewModal() {
        state.viewModalOpen = false;
        state.selectedRecord = null;
    }

    async function editRecord(record) {
        state.isCreating = false;

        state.editingRecord = {
            ...record,
            _raw: {}
        };

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

        const linkFields = state.fields.filter(field => isLinkField(field));
        for (const field of linkFields) {
            if (field.propertyKey) {
                if (!(field.propertyKey in state.editingRecord)) {
                    state.editingRecord[field.propertyKey] = '';
                }

                try {
                    if (!state.linkedEntities[getEntityNameFromField(field)]) {
                        await fetchLinkedEntityRecords(field, state.contract.contractName);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }

        state.editModalOpen = true;
        checkRequiredFields();
    }

    function openCreateForm() {
        state.isCreating = true;

        state.editingRecord = {
            _raw: {}
        };

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

        state.fields.forEach(field => {
            if (isLinkField(field) && field.propertyKey) {
                state.editingRecord[field.propertyKey] = '';

                if (!state.linkedEntities[getEntityNameFromField(field)]) {
                    fetchLinkedEntityRecords(field, state.contract.contractName);
                }
            }
        });

        state.editModalOpen = true;

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
            const jsonValue = JSON.parse(state.editingRecord._raw[fieldKey]);
            state.editingRecord[fieldKey] = jsonValue;
        } catch (e) {}
    }

    async function saveRecord() {
        if (!state.editingRecord) return;

        try {
            // Get the auth token and check authentication first
            const authToken = getAuthToken();

            if (!authToken) {
                alert("Authentication required: Please log in to save records");

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            state.saving = true;

            const recordToSave = { ...state.editingRecord };
            delete recordToSave._raw;

            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            const method = state.isCreating ? 'POST' : 'PUT';
            const url = state.isCreating
                ? `${state.baseUrl}/${endpoint}`
                : `${state.baseUrl}/${endpoint}/${recordToSave.id}`;

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(recordToSave)
            });

            if (response.status === 401 || response.status === 403) {
                alert("Authentication required: Please log in to save records");

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${state.isCreating ? 'creating' : 'updating'} record`);
            }

            await fetchData();

            closeEditModal();
        } catch (error) {
            console.error(error);
            alert(`Error ${state.isCreating ? 'creating' : 'updating'} record: ${error.message}`);
        } finally {
            state.saving = false;
        }
    }

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
            // Get the auth token and check authentication first
            const authToken = getAuthToken();

            if (!authToken) {
                alert("Authentication required: Please log in to delete records");

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            state.deleting = true;

            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();

            const url = `${state.baseUrl}/${endpoint}/${state.recordToDelete.id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                alert("Authentication required: Please log in to delete records");

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error deleting record');
            }

            await fetchData();

            closeDeleteModal();
        } catch (error) {
            console.error(error);
            alert(`Error deleting record: ${error.message}`);
        } finally {
            state.deleting = false;
        }
    }

    function isRequiredField(field) {
        if (!field) return false;

        return field.nullable === false || field.required === true;
    }

    function checkRequiredFields() {
        if (!state.editingRecord) {
            state.anyRequiredFieldEmpty = false;
            return;
        }

        const requiredFields = editableFields.value.filter(isRequiredField);

        state.anyRequiredFieldEmpty = requiredFields.some(field => {
            if (!field || !field.propertyKey) return false;

            const value = state.editingRecord[field.propertyKey];

            if (field.protoType === 'json') {
                try {
                    const rawValue = state.editingRecord._raw[field.propertyKey];
                    return !rawValue || rawValue.trim() === '' || rawValue === '{}';
                } catch (e) {
                    return true;
                }
            }

            return value === undefined || value === null || value === '';
        });
    }

    function init(contract, schema) {
        if (contract)
            initialize(contract, schema);
    }

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
            // Get the auth token and check authentication first
            const authToken = getAuthToken();

            if (!authToken) {
                state.importError = "Authentication required: Please log in to import records";

                // Call auth error handler if provided
                if (authErrorHandler && typeof authErrorHandler === 'function') {
                    authErrorHandler();
                }

                return;
            }

            state.importing = true;
            state.importError = null;

            let data = (new Function('return ' + state.importData))();

            if (!Array.isArray(data)) {
                data = data.data || data.records || data.items || [];
            }

            state.importProgress = {
                show: true,
                total: data.length,
                current: 0,
                success: 0,
                failed: 0
            };

            const endpoint = state.contract.controllerCustomPath ||
                             state.contract.controllerName.toLowerCase();
            const url = `${state.baseUrl}/${endpoint}`;

            for (let i = 0; i < data.length; i++) {
                const record = data[i];

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(record)
                    });

                    if (response.status === 401 || response.status === 403) {
                        state.importError = "Authentication required: Please log in to import records";

                        // Call auth error handler if provided
                        if (authErrorHandler && typeof authErrorHandler === 'function') {
                            authErrorHandler();
                        }

                        break;
                    }

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to import record');
                    }

                    state.importProgress.success++;
                } catch (error) {
                    console.error(error);
                    state.importProgress.failed++;

                    if (!state.importOptions.skipErrors) {
                        state.importError = `Error importing record ${i + 1}: ${error.message}`;
                        break;
                    }
                }

                state.importProgress.current = i + 1;
            }

            if (state.importProgress.failed === 0) {
                alert(`Successfully imported ${state.importProgress.success} records.`);
                closeImportModal();
            } else {
                state.importError = `Import completed with ${state.importProgress.failed} errors.`;
            }

            await fetchData();
        } catch (error) {
            console.error(error);
            state.importError = error.message || 'Failed to import data';
        } finally {
            state.importing = false;
        }
    }

    function validateImportData(records) {
        state.validationErrors = [];

        if (!records || records.length === 0) {
            state.validationErrors.push('No records to import');
            return;
        }

        const requiredFields = state.fields.filter(field =>
            field && field.propertyKey && (field.nullable === false || field.required === true)
        );

        if (requiredFields.length === 0) {
            return;
        }

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

    function handleSearchFieldChange() {
        state.currentPage = 1;
        saveStateToLocalStorage();
        fetchData();
    }

    function isLinkField(field) {
        if (!field || !field.propertyKey) return false;

        const isLink = field.propertyKey.endsWith('Id') ||
                    field.propertyKey.endsWith('_id') ||
                    field.relation ||
                    (field.link && Array.isArray(field.link) && field.link.length > 0);

        return isLink;
    }

    function getEntityNameFromField(field) {
        if (field.link && Array.isArray(field.link) && field.link.length > 0) {
            const linkInfo = field.link[0];
            return linkInfo.entityType || linkInfo.entityName || linkInfo.contract || '';
        }

        if (field.relation) return field.relation;

        let name = field.propertyKey || '';

        if (name.endsWith('Id')) {
            return name.substring(0, name.length - 2);
        }

        if (name.endsWith('_id')) {
            return name.substring(0, name.length - 3);
        }

        return name;
    }

    function getContractNameFromField(field) {
        if (field.link && Array.isArray(field.link) && field.link.length > 0) {
            const linkInfo = field.link[0];
            return linkInfo.contract || '';
        }
        return null;
    }

    async function fetchLinkedEntityRecords(field, contractName) {
        const entityName = getEntityNameFromField(field);

        if (state.linkedEntities[entityName])
            return state.linkedEntities[entityName];

        state.loadingLinks[entityName] = true;

        try {
            // Get the auth token and check authentication first
            const authToken = getAuthToken();

            if (!authToken) {
                state.linkedEntities[entityName] = [];
                state.loadingLinks[entityName] = false;
                return [];
            }

            let targetContract = null;
            let apiPath = '';

            if (state.schema) {
                for (const key in state.schema) {
                    const contract = state.schema[key];

                    if(contractName){
                        if (
                            contract.controllerName?.toLowerCase() === contractName.toLowerCase() ||
                            contract.contractName?.toLowerCase() === `${contractName}Contract`.toLowerCase() ||
                            contract.contractName?.toLowerCase() === contractName.toLowerCase()
                        ) {
                            targetContract = contract;
                            break;
                        }
                    }
                }
            }

            if (targetContract) {
                apiPath = targetContract.controllerCustomPath ||
                         (targetContract.controllerName ? targetContract.controllerName.toLowerCase() : '');
            } else {
                apiPath = entityName.toLowerCase();
            }

            apiPath = apiPath.replace(/^\/+/, '').replace(/\/+/g, '/');

            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/${apiPath}`;

            if (!apiPath || apiPath === '/') {
                state.linkedEntities[entityName] = [];
                return [];
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                state.linkedEntities[entityName] = [];
                return [];
            }

            if (response.status === 404) {
                state.linkedEntities[entityName] = [];
                return [];
            }

            if (!response.ok)
                throw new Error(`Failed to fetch linked entity ${entityName}: ${response.statusText}`);

            const data = await response.json();

            const records = data.result?.data ||
                          data.result?.items ||
                          data.result ||
                          data.records ||
                          data.items ||
                          data;

            state.linkedEntities[entityName] = Array.isArray(records) ? records : [];
            return state.linkedEntities[entityName];
        } catch (error) {
            state.linkedEntities[entityName] = [];
            return [];
        } finally {
            state.loadingLinks[entityName] = false;
        }
    }

    function getDisplayField(record) {
        if (!record) return '';

        const nameField = Object.keys(record).find(key =>
            ['name', 'title', 'label', 'description', 'nome', 'titulo'].includes(key.toLowerCase())
        );

        if (nameField) return record[nameField];

        const nonIdFields = Object.keys(record).filter(key =>
            !['id', '_id', 'uuid', 'createdAt', 'updatedAt', 'deletedAt'].includes(key)
        );

        if (nonIdFields.length > 0) return record[nonIdFields[0]];

        return record.id || record._id || JSON.stringify(record);
    }

    async function initLinkedEntities() {
        if (!state.fields) return;

        for (const field of state.fields) {
            if (isLinkField(field)){
                const contractName = getContractNameFromField(field);
                await fetchLinkedEntityRecords(field, contractName);
            }
        }
    }

    function getDisplayName(id, entityName) {
        if (!id || !entityName || !state.linkedEntities[entityName]) {
            return id;
        }

        const linkedEntity = state.linkedEntities[entityName].find(item => item.id === id);
        if (!linkedEntity) {
            return id;
        }

        return getDisplayField(linkedEntity);
    }

    return {
        ...toRefs(state),
        records: recordsRef,
        visibleFields,
        editableFields,
        isValidImportData,
        searchableFields,
        initialize,
        refreshData,
        fetchData,
        goToFirstPage,
        goToLastPage,
        goToNextPage,
        goToPreviousPage,
        handlePageInputChange,
        handlePageSizeChange,
        toggleSort,
        handleSearchInput,
        handleSearchFieldChange,
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
        init,
        isRequiredField,
        checkRequiredFields,
        openImportModal,
        closeImportModal,
        formatImportData,
        importRecords,
        setAuthErrorHandler,
        isLinkField,
        getEntityNameFromField,
        fetchLinkedEntityRecords,
        getDisplayField,
        initLinkedEntities,
        getDisplayName
    };
};
