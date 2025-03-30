let configFileEditor = null;

const useConfigViewer = () => {
    const { ref, reactive, computed, onMounted, watch } = Vue;

    const state = reactive({
        modules: [],
        config: {},
        activeModule: null,
        loading: false,
        error: null,
        saveSuccess: null,
        saveFailed: null,
        isRootUser: false,
        baseUrl: window.location.origin,
        formData: {},
        validationErrors: {},
        pendingChanges: false,
        saving: false,
        configFileContent: '',
        configFileChanged: false,
        isFormView: true,
        editorInitialized: false
    });

    function checkIfRootUser() {
        const storedAuth = localStorage.getItem('apiExplorerAuth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                return auth.isRoot === true || auth.roles?.includes('admin');
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    function getAuthToken() {
        const storedAuth = localStorage.getItem('apiExplorerAuth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                state.isRootUser = auth.isRoot === true || auth.roles?.includes('admin');
                return auth.token ? `Bearer ${auth.token}` : '';
            } catch (e) {
                state.isRootUser = false;
                return '';
            }
        }
        state.isRootUser = false;
        return '';
    }

    const loadModules = async () => {
        console.log('loadModules');
        try {
            state.loading = true;
            state.error = null;

            const authToken = getAuthToken();

            if (!authToken) {
                state.error = "Authentication required: Please log in as an administrator to view configurations";
                state.modules = [];
                state.loading = false;
                return;
            }

            const response = await fetch(`${state.baseUrl}/config/modules`, {
                headers: {
                    'Authorization': authToken
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Restricted Access: Administrator privileges required";
                state.modules = [];
                return;
            }

            if (!response.ok) {
                throw new Error(`Error fetching modules: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 200) {
                state.modules = data.result.data.filter(module =>
                    module.options && module.options.length > 0
                );

                await loadConfig();

                if (state.modules.length > 0 && !state.activeModule) {
                    setActiveModule(state.modules[0].name);
                }
            } else {
                state.modules = [];
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const loadConfig = async () => {
        try {
            const authToken = getAuthToken();

            if (!authToken) {
                state.config = {};
                return;
            }

            const response = await fetch(`${state.baseUrl}/config`, {
                headers: {
                    'Authorization': authToken
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.config = {};
                return;
            }

            if (!response.ok)
                throw new Error(`Error fetching config: ${response.statusText}`);

            const data = await response.json();

            if (data.status === 200) {
                state.config = data.result.data || {};
                initializeFormData();
            }
        } catch (error) {
            console.error('Error loading config:', error);
            state.config = {};
        }
    };

    const initializeFormData = () => {
        const formData = {};

        for (const module of state.modules) {
            formData[module.name] = {};

            for (const option of module.options || []) {
                const group = option.group || 'General';

                if (!formData[module.name][group])
                    formData[module.name][group] = {};

                if (option.type === 'object' && option.properties) {
                    formData[module.name][group][option.key] = {};

                    for (const [propKey, propConfig] of Object.entries(option.properties)) {
                        const currentValue = state.config[module.name]?.[group]?.[option.key]?.[propKey];
                        formData[module.name][group][option.key][propKey] =
                            currentValue !== undefined ? currentValue : propConfig.default;
                    }
                } else {
                    const currentValue = state.config[module.name]?.[group]?.[option.key];
                    formData[module.name][group][option.key] =
                        currentValue !== undefined ? currentValue : option.default;
                }
            }
        }

        state.formData = formData;
        state.pendingChanges = false;
    };

    const getModuleMetadata = (moduleName) => {
        return state.modules.find(m => m.name === moduleName) || null;
    };


    const setActiveModule = (moduleName) => {
        state.activeModule = moduleName;
    };

    const getModuleOption = (moduleName, optionKey) => {
        const module = getModuleMetadata(moduleName);
        if (!module) return null;

        return module.options.find(opt => opt.key === optionKey) || null;
    };

    const updateConfigValue = (moduleName, key, value) => {
        const option = getModuleOption(moduleName, key);
        const group = option?.group || 'General';

        if (!state.formData[moduleName]) {
            state.formData[moduleName] = {};
        }
        if (!state.formData[moduleName][group]) {
            state.formData[moduleName][group] = {};
        }

        state.formData[moduleName][group][key] = value;
        state.pendingChanges = true;
        validateField(moduleName, key, value);
    };

    const validateField = (moduleName, key, value, isJson = false, jsonError = null) => {
        const option = getModuleOption(moduleName, key);
        if (!option) return true;

        const errors = [];

        if (isJson) {
            if (jsonError) {
                errors.push(`Invalid JSON: ${jsonError.message}`);
            } else if (value && value.trim() && option.type === 'object') {
                try {
                    JSON.parse(value);
                } catch (e) {
                    errors.push('Invalid JSON format');
                }
            }
        }

        if (option.type && value !== undefined && value !== null) {
            const actualType = typeof value;

            const typeMap = {
                'string': ['string'],
                'number': ['number'],
                'boolean': ['boolean'],
                'object': ['object'],
                'array': ['object'],
                'function': ['function']
            };

            if (option.type === 'array' && !Array.isArray(value)) {
                errors.push(`Expected an array, but got ${actualType}`);
            } else if (option.type !== 'array' && typeMap[option.type] && !typeMap[option.type].includes(actualType)) {
                errors.push(`Expected type ${option.type}, but got ${actualType}`);
            }
        }

        if (option.enum && option.enum.length > 0 && value !== undefined && value !== null) {
            if (!option.enum.includes(value)) {
                errors.push(`Value must be one of: ${option.enum.join(', ')}`);
            }
        }

        if (option.type === 'number') {
            if (option.min !== undefined && value < option.min)
                errors.push(`Value must be at least ${option.min}`);

            if (option.max !== undefined && value > option.max)
                errors.push(`Value must be at most ${option.max}`);
        }

        if (option.type === 'string') {
            if (option.min !== undefined && value.length < option.min)
                errors.push(`Value must be at least ${option.min} characters`);

            if (option.max !== undefined && value.length > option.max)
                errors.push(`Value must be at most ${option.max} characters`);
        }

        if (option.pattern && option.type === 'string') {
            const regex = new RegExp(option.pattern);

            if (!regex.test(value))
                errors.push(`Value does not match the required pattern: ${option.pattern}`);
        }

        if (option.required && (value === undefined || value === null || value === ''))
            errors.push('This field is required');

        if (!state.validationErrors[moduleName])
            state.validationErrors[moduleName] = {};

        if (errors.length > 0)
            state.validationErrors[moduleName][key] = errors;
        else
            delete state.validationErrors[moduleName][key];

        return errors.length === 0;
    };

    const hasValidationErrors = () => {
        for (const module in state.validationErrors) {
            if (Object.keys(state.validationErrors[module]).length > 0) {
                return true;
            }
        }
        return false;
    };

    const prepareConfigForSave = (moduleName) => {
        const result = {};
        const moduleData = state.formData[moduleName];

        for (const [group, groupData] of Object.entries(moduleData)) {
            if (!result[group])
                result[group] = {};

            for (const [key, value] of Object.entries(groupData))
                result[group][key] = value;
        }

        return result;
    };


    const saveConfig = async () => {
        if (hasValidationErrors()) {
            state.saveFailed = {
                message: 'Please fix validation errors before saving'
            };
            return;
        }

        try {
            const authToken = getAuthToken();

            if (!authToken) {
                state.saveFailed = {
                    message: "Authentication required: Please log in as an administrator to save configuration"
                };
                return;
            }

            state.saving = true;
            state.saveSuccess = null;
            state.saveFailed = null;

            for (const moduleName in state.formData) {
                const preparedConfig = prepareConfigForSave(moduleName);

                const response = await fetch(`${state.baseUrl}/config/${moduleName}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(preparedConfig)
                });

                if (response.status === 401 || response.status === 403) {
                    state.saveFailed = {
                        message: "Restricted Access: Administrator privileges required"
                    };
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to save config for ${moduleName}`);
                }
            }

            await loadConfig();

            state.saveSuccess = {
                message: 'Configuration saved successfully'
            };

            state.pendingChanges = false;
        } catch (error) {
            console.error('Error saving config:', error);
            state.saveFailed = {
                message: error.message
            };
        } finally {
            state.saving = false;
        }
    };

    const resetChanges = () => {
        initializeFormData();
        state.validationErrors = {};
    };

    const clearNotifications = () => {
        state.saveSuccess = null;
        state.saveFailed = null;
    };

    const getOptionGroups = (moduleName) => {
        const module = getModuleMetadata(moduleName);
        if (!module) return [];

        const groups = {};

        for (const option of module.options) {
            const groupName = option.group || 'General';

            if (!groups[groupName])
                groups[groupName] = [];

            groups[groupName].push(option);
        }

        return Object.entries(groups).map(([name, options]) => ({
            name,
            options
        })).sort((a, b) => {
            if (a.name === 'General') return -1;
            if (b.name === 'General') return 1;
            return a.name.localeCompare(b.name);
        });
    };

    const formatObjectValue = (value) => {
        if (!value) return '{ }';
        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return '{ }';
        }
    };

    const updateNestedConfigValue = (moduleName, group, parentKey, key, value) => {
        if (!state.formData[moduleName])
            state.formData[moduleName] = {};

        if (!state.formData[moduleName][group])
            state.formData[moduleName][group] = {};

        if (!state.formData[moduleName][group][parentKey])
            state.formData[moduleName][group][parentKey] = {};

        state.formData[moduleName][group][parentKey][key] = value;
        state.pendingChanges = true;

        validateNestedField(moduleName, group, parentKey, key, value);
    };

    const validateNestedField = (moduleName, group, parentKey, key, value) => {
        const option = getModuleOption(moduleName, key);
        if (!option || !option.properties) return true;

        const propConfig = option.properties[key];
        if (!propConfig) return true;

        const errors = [];

        if (propConfig.type && value !== undefined && value !== null) {
            const actualType = typeof value;

            const typeMap = {
                'string': ['string'],
                'number': ['number'],
                'boolean': ['boolean'],
                'object': ['object'],
                'array': ['object'],
                'function': ['function']
            };

            if (propConfig.type === 'array' && !Array.isArray(value)) {
                errors.push(`Expected an array, but got ${actualType}`);
            } else if (propConfig.type !== 'array' && typeMap[propConfig.type] && !typeMap[propConfig.type].includes(actualType)) {
                errors.push(`Expected type ${propConfig.type}, but got ${actualType}`);
            }
        }

        if (propConfig.required && (value === undefined || value === null || value === '')) {
            errors.push('This field is required');
        }

        if (propConfig.enum && propConfig.enum.length > 0 && value !== undefined && value !== null) {
            if (!propConfig.enum.includes(value))
                errors.push(`Value must be one of: ${propConfig.enum.join(', ')}`);
        }

        if (propConfig.type === 'number') {
            if (propConfig.min !== undefined && value < propConfig.min)
                errors.push(`Value must be at least ${propConfig.min}`);


            if (propConfig.max !== undefined && value > propConfig.max)
                errors.push(`Value must be at most ${propConfig.max}`);
        }

        if (propConfig.type === 'string') {
            if (propConfig.min !== undefined && value.length < propConfig.min)
                errors.push(`Value must be at least ${propConfig.min} characters`);

            if (propConfig.max !== undefined && value.length > propConfig.max)
                errors.push(`Value must be at most ${propConfig.max} characters`);
        }

        if (propConfig.pattern && propConfig.type === 'string') {
            const regex = new RegExp(propConfig.pattern);
            if (!regex.test(value)) {
                errors.push(`Value does not match the required pattern: ${propConfig.pattern}`);
            }
        }

        if (!state.validationErrors[moduleName])
            state.validationErrors[moduleName] = {};

        if (!state.validationErrors[moduleName][group])
            state.validationErrors[moduleName][group] = {};

        const fullKey = `${parentKey}.${key}`;

        if (errors.length > 0)
            state.validationErrors[moduleName][group][fullKey] = errors;
        else
            delete state.validationErrors[moduleName][group][fullKey];

        return errors.length === 0;
    };

    const initConfigFileEditor = () => {

        if (!configFileEditor) {
            try {
                const editorElement = document.getElementById('configFileEditor');

                state.editorInitialized = true;
                configFileEditor = monaco.editor.create(editorElement, {
                    value: state.configFileContent || '',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: {
                        enabled: false
                    }
                });

                configFileEditor.onDidChangeModelContent(() => {
                    state.configFileChanged = true;
                });
            } catch (error) {
                console.error('Error initializing Monaco editor:', error);
                state.editorInitialized = false;
            }
        }
    };

    const loadConfigFile = async () => {
        try {
            const authToken = getAuthToken();

            if (!authToken) {
                state.error = "Authentication required: Please log in as an administrator to view configuration file";
                state.configFileContent = '';
                return;
            }

            const response = await fetch(`${state.baseUrl}/config/file`, {
                headers: {
                    'Authorization': authToken
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Restricted Access: Administrator privileges required";
                return;
            }

            if (!response.ok)
                throw new Error(`Error fetching config file: ${response.statusText}`);

            const data = await response.json();

            if (data.status === 200) {
                state.configFileContent = data.result.data;

                if (configFileEditor)
                    configFileEditor.setValue(state.configFileContent);

                state.configFileChanged = false;
            }
        } catch (error) {
            console.error('Error loading config file:', error);
            state.error = error.message;
        }
    };

    const saveConfigFile = async () => {
        if (!configFileEditor) return;

        try {
            const authToken = getAuthToken();

            if (!authToken) {
                state.saveFailed = {
                    message: "Authentication required: Please log in as an administrator to save configuration file"
                };
                return;
            }

            state.saving = true;
            const content = configFileEditor.getValue();

            const response = await fetch(`${state.baseUrl}/config/file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                },
                body: JSON.stringify({ content })
            });

            if (response.status === 401 || response.status === 403) {
                state.saveFailed = {
                    message: "Restricted Access: Administrator privileges required"
                };
                return;
            }

            if (!response.ok)
                throw new Error(`Error saving config file: ${response.statusText}`);

            state.configFileChanged = false;
            state.saveSuccess = {
                message: 'Configuration file saved successfully'
            };

            await loadModules();
        } catch (error) {
            console.error('Error saving config file:', error);
            state.saveFailed = {
                message: error.message
            };
        } finally {
            state.saving = false;
        }
    };

    const toggleView = () => {
        state.isFormView = !state.isFormView;
        if (!configFileEditor) {
            loadConfigFile().then(() => {
                setTimeout(initConfigFileEditor, 100);
            });
        }
    };

    const cleanup = () => {
        if (configFileEditor) {
            configFileEditor.dispose();
            configFileEditor = null;
            state.editorInitialized = false;
        }
    };

    const initialize = () => {
        const authToken = getAuthToken();

        if (authToken) {
            loadModules();
            if (!state.isFormView) {
                loadConfigFile().then(() => {
                    setTimeout(initConfigFileEditor, 100);
                });
            }
        } else {
            state.error = "Authentication required: Please log in as an administrator to view configurations";
            state.modules = [];
        }

        if (typeof window !== 'undefined')
            window.addEventListener('beforeunload', cleanup);
    };

    onMounted(() => {
        initialize();
    });

    return {
        formatObjectValue,
        modules: computed(() => state.modules),
        activeModule: computed(() => state.activeModule),
        config: computed(() => state.config),
        loading: computed(() => state.loading),
        saving: computed(() => state.saving),
        error: computed(() => state.error),
        formData: computed(() => state.formData),
        validationErrors: computed(() => state.validationErrors),
        pendingChanges: computed(() => state.pendingChanges),
        saveSuccess: computed(() => state.saveSuccess),
        saveFailed: computed(() => state.saveFailed),
        isRootUser: computed(() => state.isRootUser),
        loadModules,
        loadConfig,
        setActiveModule,
        getModuleMetadata,
        getModuleOption,
        updateConfigValue,
        validateField,
        saveConfig,
        resetChanges,
        clearNotifications,
        getOptionGroups,
        updateNestedConfigValue,
        validateNestedField,
        configFileChanged: computed(() => state.configFileChanged),
        isFormView: computed(() => state.isFormView),
        saveConfigFile,
        toggleView,
        cleanup
    };
};
