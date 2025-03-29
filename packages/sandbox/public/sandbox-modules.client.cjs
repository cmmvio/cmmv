// This assumes markdown-it is loaded via a script tag in the HTML

const md = window.markdownit({
  html: true,         // Enable HTML tags in source
  linkify: true,      // Autoconvert URL-like text to links
  typographer: true,  // Enable some language-neutral replacement + quotes beautification
  breaks: true,       // Convert '\n' in paragraphs into <br>
  highlight: function (str, lang) {
    // Optional syntax highlighting
    if (lang && window.hljs && window.hljs.getLanguage(lang)) {
      try {
        return `<pre class="bg-neutral-900 p-3 rounded-md overflow-x-auto my-4"><code class="language-${lang} text-neutral-300 text-sm">${window.hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (error) {
        console.error(error);
      }
    }
    // Default styling if no highlighting
    return `<pre class="bg-neutral-900 p-3 rounded-md overflow-x-auto my-4"><code class="text-neutral-300 text-sm">${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// Add custom styling to rendered output
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
  // Add target="_blank" and styling to all links
  tokens[idx].attrPush(['class', 'text-blue-400 hover:underline']);
  tokens[idx].attrPush(['target', '_blank']);
  return defaultRender(tokens, idx, options, env, self);
};

// Configure tables
md.renderer.rules.table_open = function() {
  return '<table class="min-w-full border-collapse my-4">';
};

md.renderer.rules.thead_open = function() {
  return '<thead class="bg-neutral-800">';
};

md.renderer.rules.th_open = function() {
  return '<th class="border border-neutral-700 px-4 py-2 text-neutral-300 font-semibold">';
};

md.renderer.rules.td_open = function() {
  return '<td class="border border-neutral-700 px-4 py-2">';
};

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
        togglingModule: null,
        readmeContent: null,
        readmeLoading: false,
        readmeError: null,
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
                // Buscar status para cada módulo instalado
                for (const module of state.modules) {
                    if (module.installed) {
                        await fetchModuleStatus(module.name);
                    }
                }
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
                fetchModuleReadme(data.data);
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
        fetchModuleReadme(module);
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

    const refreshData = async () => {
        await fetchAllModules();
        await fetchInstalledModules();
        await fetchModulesByCategory();
        await fetchPackageManager();
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
                m.description.toLowerCase().includes(query) ||
                (m.tags && Array.isArray(m.tags) && m.tags.some(tag =>
                    tag.toLowerCase().includes(query)
                ))
            );
        }

        return result;
    });

    const availableCategories = computed(() => {
        const categories = new Set(state.modules.map(m => m.category));
        return ['All', ...Array.from(categories).sort()];
    });

    const fetchModuleStatus = async (moduleName) => {
        try {
            const response = await fetch(`${state.baseUrl}/modules/${moduleName}/status`, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching module status: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                state.moduleStatus[moduleName] = data.data.enabled;
            }
        } catch (error) {
            console.error(`Error fetching status for module ${moduleName}:`, error);
        }
    };

    const toggleModuleStatus = async (module) => {
        if (!module || state.togglingModule === module.name) return;

        try {
            state.togglingModule = module.name;

            const response = await fetch(`${state.baseUrl}/modules/${module.name}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enable: !module.isEnabled
                })
            });

            if (!response.ok) {
                throw new Error(`Error toggling module: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                module.isEnabled = !module.isEnabled;
                await refreshData(); // Recarregar dados para atualizar o estado
            }
        } catch (error) {
            console.error(`Error toggling module ${module.name}:`, error);
        } finally {
            state.togglingModule = null;
        }
    };

    const initialize = () => {
        getAuthToken();
        refreshData();
        state.modules.forEach(module => {
            fetchModuleStatus(module.name);
        });
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

    const fetchModuleReadme = async (module) => {
        if (!module || !module.github) return;

        try {
            state.readmeLoading = true;
            state.readmeError = null;
            state.readmeContent = null;

            // Extract organization and repo from GitHub URL
            let repoUrl = module.github;
            let isMonorepo = repoUrl.includes('/tree/');
            let defaultBranch = 'main';
            let subPath = '';

            // Handle monorepo modules
            if (isMonorepo) {
                // Extract subpath from /tree/branch/path format
                const treePathMatch = repoUrl.match(/\/tree\/([^/]+)\/(.+)/);
                if (treePathMatch) {
                    defaultBranch = treePathMatch[1];
                    subPath = treePathMatch[2];
                    // Remove the /tree/branch/path part to get base repo URL
                    repoUrl = repoUrl.replace(/\/tree\/[^/]+\/.*$/, '');
                }
            }

            // Convert GitHub URL to raw content URL base
            let rawBaseUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com');

            // Try fetching README from different locations
            const possiblePaths = [
                // Main path (if in monorepo, this is the submodule README)
                `${rawBaseUrl}/${defaultBranch}/${subPath ? subPath + '/' : ''}README.md`,
                // Capital README
                `${rawBaseUrl}/${defaultBranch}/${subPath ? subPath + '/' : ''}README.MD`,
                // Lowercase readme
                `${rawBaseUrl}/${defaultBranch}/${subPath ? subPath + '/' : ''}readme.md`,
                // Try master branch if main fails
                `${rawBaseUrl}/master/${subPath ? subPath + '/' : ''}README.md`,
                // Try master branch with lowercase
                `${rawBaseUrl}/master/${subPath ? subPath + '/' : ''}readme.md`
            ];

            // If it's a monorepo, also try the root README
            if (isMonorepo) {
                possiblePaths.push(`${rawBaseUrl}/${defaultBranch}/README.md`);
                possiblePaths.push(`${rawBaseUrl}/master/README.md`);
            }

            let content = null;

            // Try each possible path until one works
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        content = await response.text();
                        break;
                    }
                } catch (err) {
                    // Continue to next path
                    console.log(`Failed to fetch README from ${path}`);
                }
            }

            if (content) {
                state.readmeContent = content;
            } else {
                throw new Error('No README found in any of the expected locations');
            }
        } catch (error) {
            console.error('Error fetching module README:', error);
            state.readmeError = `Failed to load README: ${error.message}`;
        } finally {
            state.readmeLoading = false;
        }
    };

    const parsedReadmeContent = computed(() => {
        if (!state.readmeContent) return '';

        try {
            return md.render(state.readmeContent);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return `<p class="text-red-400">Error rendering markdown: ${error.message}</p>`;
        }
    });

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
        clearAllNotifications,
        moduleStatus: computed(() => state.moduleStatus),
        togglingModule: computed(() => state.togglingModule),
        toggleModuleStatus,
        readmeContent: computed(() => state.readmeContent),
        parsedReadmeContent,
        readmeLoading: computed(() => state.readmeLoading),
        readmeError: computed(() => state.readmeError),
        fetchModuleReadme,
    };
};
