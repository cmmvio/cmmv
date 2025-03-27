const useOAuthManager = () => {
    const { ref, reactive, computed } = Vue;

    const newClient = ref({
        clientName: '',
        redirectUris: ['http://localhost:3000/oauth/handler'],
        allowedGrantTypes: [],
        allowedScopes: [],
        accessTokenLifetime: 3600,
        refreshTokenLifetime: 86400,
        authorizedDomains: ['localhost:3000'],
        isActive: true
    });

    const state = reactive({
        clients: [],
        selectedClient: null,
        isEditing: false,
        isCreating: false,
        loading: false,
        error: null,
        success: null,
        baseUrl: window.location.origin,
        tempRedirectUri: '',
        tempDomain: '',
        tempScope: '',
        availableGrantTypes: [
            { id: 'authorization_code', name: 'Authorization Code' },
            { id: 'client_credentials', name: 'Client Credentials' },
            { id: 'password', name: 'Resource Owner Password' },
            { id: 'refresh_token', name: 'Refresh Token' },
            { id: 'implicit', name: 'Implicit' }
        ],
        availableScopes: [
            { id: 'read', name: 'Read' },
            { id: 'write', name: 'Write' },
            { id: 'admin', name: 'Admin' },
            { id: 'profile', name: 'Profile' },
            { id: 'email', name: 'Email' }
        ],
        confirmAction: {
            show: false,
            message: '',
            callback: null
        },
        showSecret: false,
        showClientId: false,
        secretDialog: {
            show: false,
            client: null
        }
    });

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

    const fetchClients = async () => {
        try {
            state.loading = true;
            state.error = null;

            const response = await fetch(`${state.baseUrl}/oauth/clients`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken(),
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch OAuth clients: ${response.statusText}`);
            }

            const data = await response.json();
            state.clients = data.result.data || [];
        } catch (error) {
            console.error('Error fetching OAuth clients:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const fetchClientDetails = async (clientId) => {
        try {
            state.loading = true;
            state.error = null;

            const response = await fetch(`${state.baseUrl}/oauth/client/admin/${clientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken(),
                },
            });

            if (!response.ok)
                throw new Error(`Failed to fetch client details: ${response.statusText}`);

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error(`Error fetching client details for ${clientId}:`, error);
            state.error = error.message;
            return null;
        } finally {
            state.loading = false;
        }
    };

    const selectClient = async (clientId) => {
        if (clientId) {
            const client = await fetchClientDetails(clientId);
            if (client) {
                state.selectedClient = client;
                state.isEditing = true;
                state.isCreating = false;
            }
        } else {
            state.selectedClient = null;
            state.isEditing = false;
        }
    };

    const createClient = async (client) => {
        try {
            state.loading = true;
            state.error = null;

            if (!validateClient(client))
                return;

            const response = await fetch(`${state.baseUrl}/oauth/client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken(),
                },
                body: JSON.stringify(client),
            });

            if (!response.ok)
                throw new Error(`Failed to create client: ${response.statusText}`);

            resetNewClient();
            state.success = 'OAuth client created successfully';
            state.isCreating = false;

            setTimeout(() => {
                state.success = null;
            }, 3000);

            await fetchClients();
        } catch (error) {
            console.error('Error creating OAuth client:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const updateClient = async () => {
        try {
            state.loading = true;
            state.error = null;

            if (!validateClient(state.selectedClient))
                return;

            const response = await fetch(`${state.baseUrl}/oauth/client/${state.selectedClient.clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken(),
                },
                body: JSON.stringify(state.selectedClient),
            });

            if (!response.ok) {
                throw new Error(`Failed to update client: ${response.statusText}`);
            }

            state.success = 'OAuth client updated successfully';

            setTimeout(() => {
                state.success = null;
            }, 3000);

            await fetchClients();
        } catch (error) {
            console.error('Error updating OAuth client:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const deleteClient = async (clientId) => {
        try {
            state.loading = true;
            state.error = null;

            const response = await fetch(`${state.baseUrl}/oauth/client/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken(),
                },
            });

            if (!response.ok)
                throw new Error(`Failed to delete client: ${response.statusText}`);

            state.success = 'OAuth client deleted successfully';

            setTimeout(() => {
                state.success = null;
            }, 3000);

            if (state.selectedClient && state.selectedClient.clientId === clientId) {
                state.selectedClient = null;
                state.isEditing = false;
            }

            await fetchClients();
        } catch (error) {
            console.error('Error deleting OAuth client:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }
    };

    const validateClient = (client) => {
        console.log(client);
        if (!client.clientName || client.clientName.trim() === '') {
            state.error = 'Client name is required';
            return false;
        }

        if (client.redirectUris.length === 0) {
            state.error = 'At least one redirect URI is required';
            return false;
        }

        if (client.allowedGrantTypes.length === 0) {
            state.error = 'At least one grant type is required';
            return false;
        }

        if (client.allowedScopes.length === 0) {
            state.error = 'At least one scope is required';
            return false;
        }

        return true;
    };

    const resetNewClient = () => {
        newClient.value = {
            clientId: '',
            clientName: '',
            clientSecret: '',
            redirectUris: ['http://localhost:3000/oauth/handler'],
            allowedGrantTypes: [],
            allowedScopes: [],
            accessTokenLifetime: 3600,
            refreshTokenLifetime: 86400,
            authorizedDomains: ['localhost:3000'],
            isActive: true
        };
    };

    const addRedirectUri = () => {
        const uri = state.tempRedirectUri.trim();
        if (uri && (state.isCreating || state.isEditing)) {
            try {
                new URL(uri);

                const client = state.isCreating ? newClient.value : state.selectedClient;

                if (client && !client.redirectUris.includes(uri))
                    client.redirectUris.push(uri);

                state.tempRedirectUri = '';
            } catch (e) {
                state.error = 'Invalid URI format';
                setTimeout(() => {
                    state.error = null;
                }, 3000);
            }
        }
    };

    const removeRedirectUri = (uri) => {
        const client = state.isCreating ? newClient.value : state.selectedClient;
        if (client) {
            client.redirectUris = client.redirectUris.filter(u => u !== uri);
        }
    };

    const addDomain = () => {
        const domain = state.tempDomain.trim();
        if (domain && (state.isCreating || state.isEditing)) {
            const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^localhost(:[0-9]+)?$/;
            if (domainRegex.test(domain)) {
                const client = state.isCreating ? newClient.value : state.selectedClient;

                if (client && !client.authorizedDomains.includes(domain))
                    client.authorizedDomains.push(domain);

                state.tempDomain = '';
            } else {
                state.error = 'Invalid domain format';
                setTimeout(() => {
                    state.error = null;
                }, 3000);
            }
        }
    };

    const removeDomain = (domain) => {
        const client = state.isCreating ? newClient.value : state.selectedClient;

        if (client)
            client.authorizedDomains = client.authorizedDomains.filter(d => d !== domain);
    };

    const startCreatingClient = () => {
        resetNewClient();
        state.isCreating = true;
        state.isEditing = false;
        state.selectedClient = null;
    };

    const cancelEdit = () => {
        state.isCreating = false;
        state.isEditing = false;
        state.selectedClient = null;
        resetNewClient();
    };

    const showConfirmDialog = (message, callback) => {
        state.confirmAction.show = true;
        state.confirmAction.message = message;
        state.confirmAction.callback = callback;
    };

    const confirmDialog = () => {
        if (state.confirmAction.callback) {
            state.confirmAction.callback();
        }
        state.confirmAction.show = false;
        state.confirmAction.message = '';
        state.confirmAction.callback = null;
    };

    const cancelDialog = () => {
        state.confirmAction.show = false;
        state.confirmAction.message = '';
        state.confirmAction.callback = null;
    };

    const showAuthDialog = (client) => {
        const authUrl = new URL(`${state.baseUrl}/oauth/auth`);

        authUrl.searchParams.append('client_id', client.clientId);

        if (client.redirectUris && client.redirectUris.length > 0) {
            authUrl.searchParams.append('redirect_uri', client.redirectUris[0]);
        } else {
            state.error = 'No redirect URI configured for this client';
            setTimeout(() => { state.error = null; }, 3000);
            return;
        }

        authUrl.searchParams.append('response_type', 'code');

        const scopeString = client.allowedScopes.join(' ');
        authUrl.searchParams.append('scope', scopeString);

        const randomState = Math.random().toString(36).substring(2, 15) +
                             Math.random().toString(36).substring(2, 15);
        authUrl.searchParams.append('state', randomState);

        const messageHandler = async (event) => {
            if (event.data && event.data.type === 'oauth-approval') {
                if (event.data.state === randomState) {
                    if (event.data.approved) {
                        const url = new URL(event.data.redirectUrl);
                        const code = url.searchParams.get('code');
                        const accessToken = url.searchParams.get('access_token');
                        url.searchParams.append('client_secret', client.clientSecret);

                        if (code) {
                            //This is not secure, but it's only for testing
                            const response = await fetch(url.toString(), {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });

                            const result = await response.json();
                            const data = result.result;
                            console.log(`Authorization approved! Redirect URL: ${event.data.redirectUrl}`);
                            console.log('Received authorization code:', code);
                            console.log('Received access token:', data.token);
                            console.log('Received refresh token:', data.refreshToken);
                            state.success = `Authorization successful! Code: ${code}`;
                            setTimeout(() => {
                                alert(`Authorization successful! Access token: ${data.token}`);
                            }, 1000);
                        } else if (accessToken) {
                            console.log('Received access token:', accessToken);
                            state.success = 'Authorization successful! Token received.';
                        }
                    } else {
                        alert('Authorization was denied by the user.');
                        state.error = 'Authorization denied by user.';
                    }

                    window.removeEventListener('message', messageHandler);

                    setTimeout(() => {
                        state.success = null;
                        state.error = null;
                    }, 5000);
                } else {
                    console.error('State mismatch, possible CSRF attack');
                    state.error = 'Security validation failed. Please try again.';
                }
            }
        };

        // Add the message event listener
        window.addEventListener('message', messageHandler);

        const authWindow = window.open(
            authUrl.toString(),
            'oauth-authorization',
            'width=550,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
        );

        if (authWindow) {
            authWindow.focus();
        } else {
            // If popup blocked, show an error
            state.error = 'Pop-up window was blocked. Please allow pop-ups for this site.';
            setTimeout(() => { state.error = null; }, 5000);
            // Clean up the event listener if the window failed to open
            window.removeEventListener('message', messageHandler);
        }

        // Log the authorization URL for debugging
        console.log('OAuth authorization URL:', authUrl.toString());
    };

    const initialize = () => {
        fetchClients();
    };

    initialize();

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            state.success = 'Copied to clipboard';
            setTimeout(() => {
                state.success = null;
            }, 2000);
        } catch (err) {
            state.error = 'Failed to copy: ' + err;
            setTimeout(() => {
                state.error = null;
            }, 3000);
        }
    };

    const showSecretDialog = (client) => {
        state.secretDialog.client = client;
        state.secretDialog.show = true;
        state.showSecret = false; // Start with secret hidden
    };

    const closeSecretDialog = () => {
        state.secretDialog.show = false;
        state.secretDialog.client = null;
        state.showSecret = false;
    };

    return {
        newClient,
        clients: computed(() => state.clients),
        selectedClient: computed(() => state.selectedClient),
        isEditing: computed(() => state.isEditing),
        isCreating: computed(() => state.isCreating),
        loading: computed(() => state.loading),
        error: computed(() => state.error),
        success: computed(() => state.success),
        tempRedirectUri: computed({
            get: () => state.tempRedirectUri,
            set: (value) => { state.tempRedirectUri = value }
        }),
        tempDomain: computed({
            get: () => state.tempDomain,
            set: (value) => { state.tempDomain = value }
        }),
        tempScope: computed({
            get: () => state.tempScope,
            set: (value) => { state.tempScope = value }
        }),
        availableGrantTypes: computed(() => state.availableGrantTypes),
        availableScopes: computed(() => state.availableScopes),
        confirmAction: computed(() => state.confirmAction),
        currentClient: computed(() => {
            return state.isCreating ? newClient.value : state.selectedClient;
        }),
        fetchClients,
        selectClient,
        createClient,
        updateClient,
        deleteClient,
        addRedirectUri,
        removeRedirectUri,
        addDomain,
        removeDomain,
        startCreatingClient,
        cancelEdit,
        showConfirmDialog,
        confirmDialog,
        cancelDialog,
        showSecret: computed(() => state.showSecret),
        showClientId: computed(() => state.showClientId),
        toggleSecret: () => state.showSecret = !state.showSecret,
        toggleClientId: () => state.showClientId = !state.showClientId,
        copyToClipboard,
        secretDialog: computed(() => state.secretDialog),
        showSecretDialog,
        closeSecretDialog,
        showAuthDialog
    };
};
