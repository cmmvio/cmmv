const useModulesViewer = () => {
    const { ref, reactive, computed, onMounted } = Vue;

    const state = reactive({
        modules: [],
        installedModules: [],
        modulesByCategory: {},
        selectedModule: null,
        loading: false,
        error: null,
        baseUrl: window.location.origin,
        view: 'grid',
        isRootUser: false,
        searchQuery: '',
        selectedCategory: 'All',
        installing: null,
        installSuccess: null,
        installError: null,
        packageManager: null,
        updating: null,
        updateSuccess: null,
        updateError: null,
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

    const fetchAllModules = async () => {
        try {
            state.loading = true;
            state.error = null;

            const response = await fetch(`${state.baseUrl}/modules`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching modules: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.result) {
                state.modules = data.result.data;
            } else {
                state.modules = [];
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const fetchInstalledModules = async () => {
        try {
            const response = await fetch(`${state.baseUrl}/modules/installed`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching installed modules: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                state.installedModules = data.data;
            } else {
                state.installedModules = [];
            }
        } catch (error) {
            console.error('Error fetching installed modules:', error);
        }
    };

    const fetchModulesByCategory = async () => {
        try {
            const response = await fetch(`${state.baseUrl}/modules/categories`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching module categories: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                state.modulesByCategory = data.data;
            } else {
                state.modulesByCategory = {};
            }
        } catch (error) {
            console.error('Error fetching module categories:', error);
        }
    };

    const fetchModuleDetails = async (moduleName) => {
        try {
            state.loading = true;

            const response = await fetch(`${state.baseUrl}/modules/${moduleName}`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching module details: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                state.selectedModule = data.data;
                state.view = 'detail';
            } else {
                throw new Error(data.message || 'Module not found');
            }
        } catch (error) {
            console.error(`Error fetching module details for ${moduleName}:`, error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const selectModule = (module) => {
        state.selectedModule = module;
        state.view = 'detail';
    };

    const goBack = () => {
        state.view = 'grid';
        state.selectedModule = null;
    };

    const fetchPackageManager = async () => {
        try {
            const response = await fetch(`${state.baseUrl}/modules/package-manager`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (data.success && data.data) {
                state.packageManager = data.data.packageManager;
            }
        } catch (error) {
            console.error('Error fetching package manager:', error);
        }
    };

    const refreshData = () => {
        fetchAllModules();
        fetchInstalledModules();
        fetchModulesByCategory();
        fetchPackageManager();
    };

    const filteredModules = computed(() => {
        let result = [...state.modules];

        // Filtrar por categoria
        if (state.selectedCategory !== 'All') {
            result = result.filter(m => m.category === state.selectedCategory);
        }

        // Filtrar por pesquisa
        if (state.searchQuery.trim() !== '') {
            const query = state.searchQuery.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.description.toLowerCase().includes(query)
            );
        }

        return result;
    });

    const availableCategories = computed(() => {
        const categories = new Set(state.modules.map(m => m.category));
        return ['All', ...Array.from(categories).sort()];
    });

    const initialize = () => {
        getAuthToken();
        refreshData();
        console.log('Visualização inicial:', state.view);
    };

    // Nova função para instalar um módulo principal
    const installModule = async (module) => {
        if (!module || module.installed) return;

        try {
            state.installing = module.name;
            state.installSuccess = null;
            state.installError = null;

            const response = await fetch(`${state.baseUrl}/modules/install`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moduleName: module.name,
                    dependencies: module.dependencies
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to install module');
            }

            if (data.status === 200) {
                state.installSuccess = {
                    message: `Module ${module.name} installed successfully.`,
                    module: module.name
                };

                module.installed = true;

                setTimeout(() => {
                    refreshData();
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to install module');
            }
        } catch (error) {
            console.error(`Error installing module ${module.name}:`, error);
            state.installError = {
                message: error.message,
                module: module.name
            };
        } finally {
            state.installing = null;
        }
    };

    // Nova função para instalar um submódulo
    const installSubmodule = async (parentModule, submodule) => {
        if (!parentModule || !submodule || submodule.installed) return;

        try {
            state.installing = submodule.name;
            state.installSuccess = null;
            state.installError = null;

            const response = await fetch(`${state.baseUrl}/modules/install-submodule`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moduleName: parentModule.name,
                    submoduleName: submodule.name,
                    packageName: submodule.packageName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to install submodule');
            }

            if (data.status === 200) {
                state.installSuccess = {
                    message: `Submodule ${submodule.name} for ${parentModule.name} installed successfully.`,
                    module: submodule.name
                };

                submodule.installed = true;

                setTimeout(() => {
                    refreshData();
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to install submodule');
            }
        } catch (error) {
            console.error(`Error installing submodule ${submodule.name}:`, error);
            state.installError = {
                message: error.message,
                module: submodule.name
            };
        } finally {
            state.installing = null;
        }
    };

    // Adicionar notificação de sucesso/erro
    const clearInstallNotifications = () => {
        state.installSuccess = null;
        state.installError = null;
    };

    // Adicione uma função explícita para alternar a visualização
    const toggleView = () => {
        console.log('Alternando visualização. Atual:', state.view);
        state.view = state.view === 'grid' ? 'list' : 'grid';
        console.log('Nova visualização:', state.view);
    };

    // Adicionar função para atualizar um módulo
    const updateModule = async (module) => {
        if (!module || !module.installed || !module.updateAvailable) return;

        try {
            state.updating = module.name;
            state.updateSuccess = null;
            state.updateError = null;

            const response = await fetch(`${state.baseUrl}/modules/update`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moduleName: module.name,
                    dependencies: module.dependencies
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update module');
            }

            if (data.success) {
                state.updateSuccess = {
                    message: `Module ${module.name} updated successfully.`,
                    module: module.name
                };

                // Atualizar status do módulo
                module.updateAvailable = false;

                // Recarregar informações atualizadas
                setTimeout(() => {
                    refreshData();
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to update module');
            }
        } catch (error) {
            console.error(`Error updating module ${module.name}:`, error);
            state.updateError = {
                message: error.message,
                module: module.name
            };
        } finally {
            state.updating = null;
        }
    };

    // Limpar notificações de atualização
    const clearUpdateNotifications = () => {
        state.updateSuccess = null;
        state.updateError = null;
    };

    // Atualizar a função clearInstallNotifications para também limpar notificações de atualização
    const clearAllNotifications = () => {
        state.installSuccess = null;
        state.installError = null;
        state.updateSuccess = null;
        state.updateError = null;
    };

    initialize();

    return {
        modules: computed(() => state.modules),
        installedModules: computed(() => state.installedModules),
        modulesByCategory: computed(() => state.modulesByCategory),
        filteredModules,
        availableCategories,
        selectedModule: computed(() => state.selectedModule),
        loading: computed(() => state.loading),
        error: computed(() => state.error),
        view: computed({
            get: () => state.view,
            set: (value) => {
                console.log('Alterando visualização para:', value);
                state.view = value;
            }
        }),
        isRootUser: computed(() => state.isRootUser),
        searchQuery: computed({
            get: () => state.searchQuery,
            set: (value) => { state.searchQuery = value }
        }),
        selectedCategory: computed({
            get: () => state.selectedCategory,
            set: (value) => { state.selectedCategory = value }
        }),
        installing: computed(() => state.installing),
        installSuccess: computed(() => state.installSuccess),
        installError: computed(() => state.installError),
        packageManager: computed(() => state.packageManager),
        updating: computed(() => state.updating),
        updateSuccess: computed(() => state.updateSuccess),
        updateError: computed(() => state.updateError),
        fetchAllModules,
        fetchInstalledModules,
        fetchModulesByCategory,
        fetchModuleDetails,
        selectModule,
        goBack,
        refreshData,
        installModule,
        installSubmodule,
        clearInstallNotifications,
        toggleView,
        updateModule,
        clearUpdateNotifications,
        clearAllNotifications
    };
};
