const useBackupViewer = () => {
    const { ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

    const state = reactive({
        backups: [],
        loading: false,
        error: null,
        selectedBackup: null,
        backupDetail: null,
        detailLoading: false,
        createLoading: false,
        baseUrl: window.location.origin,
        isRootUser: false,
        authModalOpen: false,
        createSuccess: null,
        currentAction: null,
        downloadProgress: null,
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

    const fetchBackups = async () => {
        try {
            state.loading = true;
            state.error = null;

            const url = `${state.baseUrl}/backups`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': getAuthToken()
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Restricted Access: Administrator privileges required";
                state.backups = [];
                return;
            }

            if (!response.ok) {
                throw new Error(`Error fetching backups: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.result) {
                state.backups = Array.isArray(data.result.data) ? data.result.data : [];
                state.backups.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                state.backups = [];
            }

        } catch (error) {
            console.error('Error fetching backups:', error);
            state.error = error.message;
            state.backups = [];
        } finally {
            state.loading = false;
        }
    };

    const createBackup = async () => {
        try {
            state.createLoading = true;
            state.currentAction = 'create';
            state.createSuccess = null;
            state.error = null;

            const url = `${state.baseUrl}/backups`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthToken(),
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                state.error = "Restricted Access: Administrator privileges required";
                return;
            }

            if (!response.ok) {
                throw new Error(`Error creating backup: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                state.createSuccess = {
                    message: result.message || 'Backup created successfully',
                    data: result.result.data
                };

                await fetchBackups();
            } else {
                throw new Error(result.message || 'Failed to create backup');
            }

        } catch (error) {
            console.error('Error creating backup:', error);
            state.error = error.message;
        } finally {
            state.createLoading = false;
            state.currentAction = null;
        }
    };

    const downloadBackup = async (filename) => {
        try {
            if (!filename) return;

            state.currentAction = 'download';
            state.downloadProgress = { status: 'starting', progress: 0 };

            const url = `${state.baseUrl}/backups/download/${filename}?token=${getAuthToken()}`;
            window.open(url, '_blank');

            state.downloadProgress = { status: 'complete', progress: 100 };

            setTimeout(() => {
                if (state.currentAction === 'download') {
                    state.currentAction = null;
                    state.downloadProgress = null;
                }
            }, 3000);

        } catch (error) {
            console.error('Error downloading backup:', error);
            state.error = error.message;
            state.downloadProgress = { status: 'error', progress: 0 };
            state.currentAction = null;
        }
    };

    const selectBackup = (backup) => {
        state.selectedBackup = backup;
    };

    const closeDetail = () => {
        state.selectedBackup = null;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes || isNaN(bytes)) return '0 Bytes';

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (milliseconds) => {
        if (!milliseconds || isNaN(milliseconds)) return '0s';

        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    function openAuthModal() {
        state.authModalOpen = true;
    }

    function closeAuthModal() {
        state.authModalOpen = false;
        checkForAuthAfterModalOpen();
    }

    let toggleAuthModalFunction = null;

    function setToggleAuthModal(fn) {
        toggleAuthModalFunction = fn;
    }

    function toggleAuthModal(callback) {
        if (toggleAuthModalFunction) {
            toggleAuthModalFunction(() => {
                if (typeof callback === 'function') {
                    console.log('Authentication callback will be executed after login');
                    setTimeout(() => {
                        if (checkIfRootUser()) {
                            console.log('User is now admin, executing callback');
                            callback();
                        }
                    }, 1000);
                }
            });

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && document.body.classList.contains('modal-closed')) {
                        const isAdmin = checkIfRootUser();
                        if (isAdmin && typeof callback === 'function') {
                            console.log('User authenticated via modal, executing callback');
                            callback();
                        }
                        observer.disconnect();
                    }
                });
            });

            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    function setupAuthListener() {
        const initialAuthState = checkIfRootUser();

        const authCheckInterval = setInterval(() => {
            const currentAuthState = checkIfRootUser();

            if (!initialAuthState && currentAuthState) {
                console.log('User authenticated as admin, refreshing backups...');
                fetchBackups();
                clearInterval(authCheckInterval);
            }
        }, 1000);

        onBeforeUnmount(() => {
            clearInterval(authCheckInterval);
        });
    }

    function handleSuccessfulAuth() {
        getAuthToken();

        if (state.isRootUser) {
            setTimeout(() => {
                fetchBackups();
            }, 500);
        }
    }

    function listenForAuthChanges() {
        window.removeEventListener('storage', handleStorageChange);

        window.addEventListener('storage', handleStorageChange);

        window.addEventListener('authSuccess', () => {
            console.log('Auth success event detected, refreshing backups...');
            getAuthToken();
            fetchBackups();
        });

        const storageCheckInterval = setInterval(() => {
            const wasAdmin = state.isRootUser;
            const isNowAdmin = checkIfRootUser();

            if (!wasAdmin && isNowAdmin) {
                console.log('User gained admin privileges, refreshing backups...');
                getAuthToken();
                fetchBackups();
            }

            state.isRootUser = isNowAdmin;
        }, 1500);

        onBeforeUnmount(() => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authSuccess', fetchBackups);
            clearInterval(storageCheckInterval);
        });
    }

    function handleStorageChange(event) {
        if (event.key === 'apiExplorerAuth') {
            console.log('Auth storage changed, checking permissions...');
            const wasAdmin = state.isRootUser;
            getAuthToken();

            if (!wasAdmin && state.isRootUser) {
                console.log('User authenticated as admin via storage event, refreshing backups...');
                fetchBackups();
            }
        }
    }

    function checkForAuthAfterModalOpen() {
        const wasAdmin = state.isRootUser;
        let checkCount = 0;

        const authCheckTimer = setInterval(() => {
            checkCount++;
            getAuthToken();

            if (!wasAdmin && state.isRootUser) {
                console.log('User authenticated successfully, refreshing backups...');
                fetchBackups();
                clearInterval(authCheckTimer);
            }

            if (checkCount >= 10) {
                clearInterval(authCheckTimer);
            }
        }, 1000);

        onBeforeUnmount(() => {
            clearInterval(authCheckTimer);
        });
    }

    const refreshData = () => {
        fetchBackups();
    };

    // Inicialização
    const initialize = () => {
        getAuthToken();
        setupAuthListener();
        listenForAuthChanges();
        fetchBackups();
    };

    initialize();

    return {
        backups: computed(() => state.backups),
        loading: computed(() => state.loading),
        createLoading: computed(() => state.createLoading),
        error: computed(() => state.error),
        selectedBackup: computed(() => state.selectedBackup),
        createSuccess: computed(() => state.createSuccess),
        currentAction: computed(() => state.currentAction),
        downloadProgress: computed(() => state.downloadProgress),
        isRootUser: computed(() => state.isRootUser),
        authModalOpen: computed(() => state.authModalOpen),
        fetchBackups,
        createBackup,
        downloadBackup,
        selectBackup,
        closeDetail,
        formatTimestamp,
        formatFileSize,
        formatDuration,
        refreshData,
        openAuthModal,
        closeAuthModal,
        setToggleAuthModal,
        toggleAuthModal
    };
};
