const { createApp } = Vue;
let schemaEditor;
let schemaChangeTimer = null;

createApp({
    data() {
        return {
            message: 'Hello Vue!',
            socket: null,
            loading: true,
            schema: {},
            selectedContract: null,
            selectedTab: 0,
            modalConfirm: false,
            modalNewContract: false,
            modalContent: {
                title: "",
                content: "",
                cb: null
            },
            tabs: [
                { label: "Options", active: false },
                { label: "Fields", active: true },
                { label: "Index", active: false },
                { label: "DTOs", active: false },
                { label: "Methods", active: false },
                { label: "Schema", active: false },
                { label: "API", active: false },
                { label: "GraphQL", active: false }
            ],
            protoTypes: {
                "int32": { key: "int32", label: "Integer (Int32)"},
                "int64": { key: "int64", label: "Integer (Int64)"},
                "float": { key: "float", label: "Float"},
                "double": { key: "double", label: "Double"},
                "bytes": { key: "bytes", label: "Bytes"},
                "string": { key: "string", label: "String"},
                "text": { key: "text", label: "Text"},
                "json": { key: "json", label: "JSON"},
                "boolean": { key: "boolean", label: "Boolean"},
                "uuid": { key: "uuid", label: "UUID"},
                "simpleArray": { key: "simpleArray", label: "Array"},
                "date": { key: "date", label: "Date"},
                "time": { key: "time", label: "Time"},
                "timestamp": { key: "timestamp", label: "Timestamp"},
                "bigint": { key: "bigint", label: "BigInt"},
                "uint32": { key: "uint32", label: "Unsigned Int32"},
                "uint64": { key: "uint64", label: "Unsigned Int64"},
                "uint32": { key: "uint32", label: "Signed Int32"},
                "uint64": { key: "uint64", label: "Signed Int64"},
                "fixed32": { key: "fixed32", label: "Fixed Int32"},
                "fixed64": { key: "fixed64", label: "Fixed Int64"},
                "any": { key: "any", label: "Any"},
                "bool": { key: "bool", label: "Bool (Alias)", alias: true },
                "number": { key: "number", label: "Number (Alias)", alias: true },
            },
            validationsTypes: {
                "IsString": { key: "IsString", label: "Is String"},
                "MinLength": { key: "MinLength", label: "Min Length"},
                "MaxLength": { key: "MaxLength", label: "Max Length"},
                "IsStrongPassword": { key: "IsStrongPassword", label: "Strong Password"},
            },
            opened: [],
            openedIndexes: {},
            openedMessages: {},
            schemaEditor: null,
            newContractData: {},
            hiddenModuleContracts: false,
            openedServices: {},
            selectedEndpoint: null,
            requestTab: 'params',
            paramValues: {},
            queryParams: {
                limit: 10,
                offset: 0,
                sortBy: '',
                sort: '',
                search: '',
                searchField: '',
                filtersJson: '',
                ids: ''
            },
            newHeader: {
                name: '',
                customName: '',
                value: ''
            },
            headers: [
                { name: 'Content-Type', value: 'application/json' }
            ],
            requestBody: {},
            showResponse: false,
            responseStatus: 0,
            responseTime: 0,
            responseBody: {},
            apiBaseUrl: window.location.origin,
            requestStatus: null,
            isLoading: false,
            currentRequestDTO: null,
            fullRequestUrl: '',
            requestFormData: {},
            responseText: '',
            sidebarOpen: true,
            apiSidebarOpen: true,
            isMobile: false,
            showAuthModal: false,
            authTab: 'token',
            bearerToken: '',
            loginCredentials: {
                username: '',
                password: ''
            },
            isLoggingIn: false,
            authData: {
                token: '',
                refreshToken: ''
            },
            pathParams: [],
            queryParamValues: {},
            headerParamValues: {},
            mainTab: 'request',
            copyStatus: false,
            contractFilter: '',
            filteredContracts: {},
            graphql: null,
            syncModalOpen: false,
            syncInProgress: false,
            syncProgress: 0,
            contractsToSync: [],
            ignoreContractChanges: false,
            recentlySyncedContracts: new Set()
        }
    },

    computed: {
        isAuthenticated() {
            return !!this.authData.token;
        },

        displayToken() {
            if (!this.authData.token) return '';
            return this.authData.token.length > 15
                ? this.authData.token.substring(0, 6) + '...' + this.authData.token.substring(this.authData.token.length - 6)
                : this.authData.token;
        },

        displayRefreshToken() {
            if (!this.authData.refreshToken) return '';
            return this.authData.refreshToken.length > 15
                ? this.authData.refreshToken.substring(0, 6) + '...' + this.authData.refreshToken.substring(this.authData.refreshToken.length - 6)
                : this.authData.refreshToken;
        },

        formattedResponse() {
            if (!this.responseText) return '';

            try {
                // Verificar se é JSON válido
                if (this.responseText.trim().startsWith('{') || this.responseText.trim().startsWith('[')) {
                    // Formatar e aplicar highlight no JSON
                    const parsedJson = JSON.parse(this.responseText);
                    const formattedJson = JSON.stringify(parsedJson, null, 2);

                    // Usar highlight.js para colorir o JSON
                    return hljs.highlight(formattedJson, { language: 'json' }).value;
                }

                // Texto não-JSON, escape para HTML
                return this.escapeHtml(this.responseText);
            } catch (e) {
                // Se falhar em parsear como JSON, retornar como texto simples
                return this.escapeHtml(this.responseText);
            }
        },

        completedCount() {
            return this.contractsToSync.filter(c => c.state === 'completed').length;
        }
    },

    mounted() {
        this.connectWebSocket();
        this.getSchema();

        const selectedTab = localStorage.getItem('selectedTab');
        const hiddenModuleContracts = localStorage.getItem('hiddenModuleContracts');

        this.selectedTab = Number(selectedTab) ?? 0;
        this.hiddenModuleContracts = (hiddenModuleContracts === 'true');

        if (!this.apiBaseUrl || this.apiBaseUrl === 'null' || this.apiBaseUrl === 'undefined')
            this.apiBaseUrl = window.location.origin;

        this.checkScreenSize();
        window.addEventListener('resize', this.checkScreenSize);

        this.loadAuthDataFromStorage();

        // Inicializar o filteredContracts
        this.filteredContracts = this.schema;

        this.graphql = useGraphQLExplorer();
        this.graphql.fetchSchema();
        this.graphql.initQueryEditor();
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.checkScreenSize);
    },

    watch: {
        schema: {
            async handler(newSchema, oldSchema) {
                localStorage.setItem("schema", JSON.stringify(newSchema));
                this.filterContracts();

                if (this.ignoreContractChanges) {
                    return;
                }

                if (schemaChangeTimer) clearTimeout(schemaChangeTimer);

                schemaChangeTimer = setTimeout(async () => {
                    if (oldSchema) {
                        await this.detectAndMarkChangedContracts(newSchema);
                    }
                }, 300);
            },
            deep: true
        },
        hiddenModuleContracts: {
            handler(newState) {
                localStorage.setItem("hiddenModuleContracts", newState);
            },
            deep: true
        },
        selectedTab: {
            handler(newValue) {
                if (this.tabs[newValue].label === "API") {
                }
            }
        },
        selectedEndpoint: {
            handler(newEndpoint) {
                if (newEndpoint) {
                    this.processRequestParameters();
                    setTimeout(() => {
                        this.updateFullRequestUrl();
                    }, 50);
                }
            }
        },
        apiBaseUrl: {
            handler() {
                this.updateFullRequestUrl();
            }
        },
        contractFilter: {
            handler() {
                this.filterContracts();
            }
        }
    },

    methods: {
        connectWebSocket(reload = false) {
            this.socket = new WebSocket("ws://localhost:4200");

            this.socket.addEventListener("message", (message) => {
                const messageData = JSON.parse(message.data);
                this.parseMesssage(messageData);
            });

            this.socket.addEventListener("open", () => {
                console.log("WebSocket Initialization");
                this.loading = false;

                if(reload)
                    window.location = window.location.href;
            });

            this.socket.addEventListener("close", () => {
                this.loading = true;
                console.log("WebSocket disconnected. Attempting to reconnect in 3 seconds...");
                setTimeout(() => this.connectWebSocket(true), 3000);
            });

            this.socket.addEventListener("error", (error) => {
                console.error("WebSocket error:", error);
            });
        },

        parseMesssage(message){
            switch(message.event){
                case "change":
                    this.loading = true;

                    if(message.filePath.includes(".css"))
                        document.getElementById("style").href = `/sandbox/style.css?t=${new Date().getTime()}`;
                    else if(message.filePath.includes(".cjs") || message.filePath.includes(".js") || message.filePath.includes(".html"))
                        window.location = window.location.href;

                    this.loading = false;
                break;
            }
        },

        async getSchema(){
            const currentSchema = localStorage.getItem("schema");

            if(!currentSchema)
                await this.refreshSchema();
            else
                this.schema = JSON.parse(currentSchema);

            const selectedContract = localStorage.getItem('selectedContract');
            this.selectedContract = this.schema[selectedContract ?? Object.keys(this.schema)[0]];

            if (this.selectedContract) {
                this.selectedContract.generateController = !!this.selectedContract.generateController;
            }

            const selectedTab = localStorage.getItem('selectedTab');
            this.selectedTab = Number(selectedTab) ?? 0;
            setTimeout(() => this.selectTab(this.selectedTab), 100);
            this.migrateIndexes();
            this.migrateMessages();
            this.migrateServices();

            // Verificar alterações nos contratos após carregá-los
            await this.checkContractsForChanges();
        },

        async refreshSchema(){
            const req = await fetch('/sandbox/schema').then();
            this.schema = (await req.json()).result.contracts;
            this.schemaToLocalStorege();
        },

        schemaToLocalStorege(){
            localStorage.setItem("schema", JSON.stringify(this.schema));
        },

        selectTab(index) {
            this.selectedTab = index;
            localStorage.setItem('selectedTab', index);
            this.updateSchemaEditor();
        },

        async selectContract(key){
            // Verificar se o contrato atual foi modificado
            if (this.selectedContract) {
                await this.updateContractSyncStatus(Object.keys(this.schema).find(k =>
                    this.schema[k].contractName === this.selectedContract.contractName));
            }

            this.selectedContract = this.schema[key];
            localStorage.setItem('selectedContract', key);
            this.opened = [];
            this.openedIndexes = {};
            this.openedMessages = {};
            this.openedServices = {};
            this.migrateIndexes();
            this.migrateMessages();
            this.migrateServices();
            this.updateSchemaEditor();
        },

        newContract(){
            this.newContractData = {};
            this.modalNewContract = true;
        },

        createContract(){
            if(this.newContractData.controllerName !== ''){
                this.schema[`${this.newContractData.controllerName}Contract`] = {
                    contractName: `${this.newContractData.controllerName}Contract`,
                    controllerName: this.newContractData.controllerName,
                    controllerCustomPath: '',
                    subPath: this.newContractData.subPath,
                    protoPath: `${this.newContractData.controllerNam?.toLowerCase() || ''}.proto`,
                    protoPackage: `${this.newContractData.subPath?.toLowerCase().replace('/','').trim() || ''}`,
                    customProto: '',
                    customTypes: '',
                    imports: [],
                    fields: [],
                    messages: [],
                    services: [],
                    indexs: [],
                    directMessage: false,
                    generateController: true,
                    generateEntities: true,
                    auth: false,
                    cache: false,
                    rootOnly: false,
                    tags: '',
                    options: {
                        tags: [],
                        description: '',
                        moduleContract: false,
                        databaseSchemaName: '',
                        databaseTimestamps: false,
                        databaseUserAction: false
                    },
                    viewForm: null,
                    viewPage: null
                }

                this.newContractData = {};
                this.modalNewContract = false;
            }
        },

        updateSchemaEditor(){
            setTimeout(() => {
                if(this.tabs[this.selectedTab].label === "Schema" && !schemaEditor){
                    schemaEditor = monaco.editor.create(document.getElementById('schemaEditor'), {
                        value: JSON.stringify(this.selectedContract, null, 4),
                        language: 'json',
                        theme: 'vs-dark',
                    });
                }

                if(this.tabs[this.selectedTab].label === "Schema" && schemaEditor)
                    schemaEditor.setValue(JSON.stringify(this.selectedContract, null, 4));
            }, 100);
        },

        isOpened(key){
            return key in this.opened ? this.opened[key] : false;
        },

        toggleOpened(key){
            const currentState = key in this.opened ? this.opened[key] : false;
            this.opened[key] = !currentState;
        },

        isIndexOpened(name) {
            return name in this.openedIndexes ? this.openedIndexes[name] : false;
        },

        toggleIndexOpened(name) {
            const currentState = name in this.openedIndexes ? this.openedIndexes[name] : false;
            this.openedIndexes[name] = !currentState;
        },

        addIndex() {
            if (this.selectedContract.options.moduleContract) return;

            if (!this.selectedContract.indexs) {
                this.selectedContract.indexs = [];
            }

            this.selectedContract.indexs.push({
                name: `index_${Date.now()}`,
                fields: [],
                options: {
                    unique: false,
                    spatial: false,
                    fulltext: false,
                    nullFiltered: false,
                    parser: '',
                    where: '',
                    sparse: false,
                    background: false,
                    concurrent: false,
                    expireAfterSeconds: null
                }
            });
        },

        removeIndex(name, indexKey) {
            if (this.selectedContract.options.moduleContract) return;

            this.modalContent = {
                title: `Do you want to remove the index '${name}'?`,
                content: `By performing this action you will permanently remove the index.`,
                metadata: { index: name },
                cb: () => {
                    this.selectedContract.indexs.splice(indexKey, 1);
                    this.modalConfirm = false;
                }
            }

            this.modalConfirm = true;
        },

        addFieldToIndex(index) {
            if (this.selectedContract.options.moduleContract) return;

            if (!index.fields) {
                index.fields = [];
            }

            index.fields.push('');
        },

        removeFieldFromIndex(index, fieldIndex) {
            if (this.selectedContract.options.moduleContract) return;
            index.fields.splice(fieldIndex, 1);
        },

        isMessageOpened(key) {
            return key in this.openedMessages ? this.openedMessages[key] : false;
        },

        toggleMessageOpened(key) {
            const currentState = key in this.openedMessages ? this.openedMessages[key] : false;
            this.openedMessages[key] = !currentState;
        },

        addMessage() {
            if (this.selectedContract.options.moduleContract) return;

            if (!this.selectedContract.messages) {
                this.selectedContract.messages = [];
            }

            const newName = `Message${this.selectedContract.messages.length + 1}`;

            this.selectedContract.messages.push({
                name: newName,
                properties: {}
            });
        },

        removeMessage(name, messageKey) {
            if (this.selectedContract.options.moduleContract) return;

            this.modalContent = {
                title: `Do you want to remove the DTO '${name}'?`,
                content: `By performing this action you will permanently remove this DTO.`,
                metadata: { message: name },
                cb: () => {
                    this.selectedContract.messages.splice(messageKey, 1);
                    this.modalConfirm = false;
                }
            }

            this.modalConfirm = true;
        },

        addPropertyToMessage(message) {
            if (this.selectedContract.options.moduleContract) return;

            if (!message.properties) {
                message.properties = {};
            }

            const newPropKey = `property${Object.keys(message.properties).length + 1}`;

            message.properties[newPropKey] = {
                type: 'string',
                required: false,
                default: '',
                paramType: 'query'
            };
        },

        updatePropertyKey(message, oldKey, newKey) {
            if (oldKey === newKey || !newKey || this.selectedContract.options.moduleContract) return;

            if (message.properties[newKey])
                return;

            const updatedProperties = {};

            Object.keys(message.properties).forEach(key => {
                if (key === oldKey) {
                    updatedProperties[newKey] = message.properties[oldKey];
                } else {
                    updatedProperties[key] = message.properties[key];
                }
            });

            message.properties = updatedProperties;
        },

        removePropertyFromMessage(message, key) {
            if (this.selectedContract.options.moduleContract) return;

            const updatedProperties = {};
            Object.keys(message.properties).forEach(propKey => {
                if (propKey !== key) {
                    updatedProperties[propKey] = message.properties[propKey];
                }
            });

            message.properties = updatedProperties;
        },

        addField() {
            if (!this.selectedContract.options.moduleContract) {
                this.selectedContract.fields.push({
                    protoType: 'boolean',
                    propertyKey: "newfield"
                });

                // Marcar contrato como não sincronizado
                const key = Object.keys(this.schema).find(k =>
                    this.schema[k].contractName === this.selectedContract.contractName);
                if (key) {
                    this.updateContractSyncStatus(key);
                }
            }
        },

        removeField(key, fieldKey) {
            if (!this.selectedContract.options.moduleContract) {
                this.modalContent = {
                    title: `Do want to remove the field '${key}'?`,
                    content: `By performing this action you will permanently remove the field and this will have repercussions throughout the application.`,
                    metadata: { field: key },
                    cb: () => {
                        const fields = this.selectedContract.fields.filter((field) => field.propertyKey !== key);
                        this.selectedContract.fields = fields;
                        this.modalConfirm = false;

                        // Marcar contrato como não sincronizado
                        const contractKey = Object.keys(this.schema).find(k =>
                            this.schema[k].contractName === this.selectedContract.contractName);
                        if (contractKey) {
                            this.updateContractSyncStatus(contractKey);
                        }
                    }
                }

                this.modalConfirm = true;
            }
        },

        getEndpoint(contract){
            return `${window.location.protocol}//${window.location.host}/${contract.controllerCustomPath ? contract.controllerCustomPath.toLowerCase() :
                contract.controllerName.toLowerCase()
            }`
        },

        syncApplication(){

        },

        migrateIndexes() {
            if (!this.selectedContract || !this.selectedContract.indexs) return;

            this.selectedContract.indexs = this.selectedContract.indexs.map(index => {
                if (index.options) return index;

                return {
                    name: index.name,
                    fields: Array.isArray(index.fields)
                        ? index.fields.map(f => typeof f === 'string' ? f : f.name)
                        : [],
                    options: {
                        unique: index.unique || false,
                        spatial: false,
                        fulltext: index.text || false,
                        nullFiltered: false,
                        parser: '',
                        where: '',
                        sparse: index.sparse || false,
                        background: false,
                        concurrent: index.compound || false,
                        expireAfterSeconds: index.expireAfterSeconds || null
                    }
                };
            });
        },

        migrateMessages() {
            if (!this.selectedContract || !this.selectedContract.messages) return;

            for (const message of this.selectedContract.messages) {
                if (message.propertyKey) {
                    if (!message.name) {
                        message.name = message.propertyKey;
                    }

                    delete message.propertyKey;
                }

                if (!message.properties) {
                    message.properties = {};
                }

                for (const propKey in message.properties) {
                    const prop = message.properties[propKey];

                    const validTypes = ['string', 'bool', 'int', 'float', 'bytes', 'date',
                                      'timestamp', 'json', 'simpleArray', 'bigint', 'any'];

                    if (!validTypes.includes(prop.type)) {
                        if (prop.type === 'boolean') prop.type = 'bool';
                        else if (prop.type === 'int32' || prop.type === 'int64') prop.type = 'int';
                        else if (prop.type === 'double') prop.type = 'float';
                        else if (prop.type === 'text') prop.type = 'string';
                        else prop.type = 'any';
                    }

                    if (prop.required === undefined) {
                        prop.required = false;
                    }
                }
            }
        },

        isServiceOpened(name) {
            return name in this.openedServices ? this.openedServices[name] : false;
        },

        toggleServiceOpened(name) {
            const currentState = name in this.openedServices ? this.openedServices[name] : false;
            this.openedServices[name] = !currentState;
        },

        addService() {
            if (this.selectedContract.options.moduleContract) return;

            if (!this.selectedContract.services) {
                this.selectedContract.services = [];
            }

            const newName = `Method${this.selectedContract.services.length + 1}`;
            const newFunctionName = newName.charAt(0).toLowerCase() + newName.slice(1);

            this.selectedContract.services.push({
                name: newName,
                path: newFunctionName,
                method: 'GET',
                functionName: newFunctionName,
                request: '',
                response: '',
                auth: false,
                createBoilerplate: false
            });
        },

        removeService(name, serviceKey) {
            if (this.selectedContract.options.moduleContract) return;

            this.modalContent = {
                title: `Do you want to remove the method '${name}'?`,
                content: `By performing this action you will permanently remove this method.`,
                metadata: { service: name },
                cb: () => {
                    this.selectedContract.services.splice(serviceKey, 1);
                    this.modalConfirm = false;
                }
            }

            this.modalConfirm = true;
        },

        migrateServices() {
            if (!this.selectedContract || !this.selectedContract.services) return;

            for (const service of this.selectedContract.services) {
                if (!service.path) service.path = service.name?.toLowerCase() || '';
                if (!service.method) service.method = 'GET';
                if (!service.functionName) service.functionName = service.name?.toLowerCase() || '';

                if (service.propertyKey && !service.name) {
                    service.name = service.propertyKey;
                }

                service.auth = service.auth === true;
                service.createBoilerplate = service.createBoilerplate === true;
            }
        },

        getDTOProperties(dtoName) {
            if (!dtoName || !this.selectedContract || !this.selectedContract.messages) return {};

            const dto = this.selectedContract.messages.find(m => m.name === dtoName);
            return dto ? (dto.properties || {}) : {};
        },

        selectEndpoint(endpoint) {
            this.selectedEndpoint = endpoint;
            this.showResponse = false;
            this.requestStatus = null;

            this.processRequestParameters();

            this.$nextTick(() => {
                const method = this.getCurrentMethod();
                const hasPathOrQueryParams = this.pathParams.length > 0 || this.queryParams.length > 0;
                const hasBodyParams = this.bodyParams.length > 0;

                if (hasPathOrQueryParams) {
                    this.requestTab = 'params';
                } else if (hasBodyParams) {
                    this.requestTab = 'body';
                } else {
                    this.requestTab = 'headers';
                }

                this.updateFullRequestUrl();
            });
        },

        resetRequestData() {
            this.paramValues = {};
            this.queryParams = { limit: 10, offset: 0, sortBy: '', sort: '', search: '', searchField: '', filtersJson: '', ids: '' };
            this.requestBody = {};
        },

        addHeader() {
            const headerName = this.newHeader.name === 'Custom' ? this.newHeader.customName : this.newHeader.name;

            if ((headerName && headerName.trim() !== '') && this.newHeader.value) {
                this.headers.push({
                    name: headerName,
                    value: this.newHeader.value
                });

                this.newHeader = {
                    name: '',
                    customName: '',
                    value: ''
                };
            }
        },

        removeHeader(index) {
            this.headers.splice(index, 1);
        },

        async sendRequest() {
            try {
                this.isLoading = true;
                this.requestStatus = { type: 'loading', message: 'Sending...' };
                this.responseText = '';

                const method = this.getCurrentMethod();
                const options = {
                    method: method,
                    headers: {},
                    credentials: 'include',
                };

                // Adicionar headers customizados
                this.headers.forEach(header => {
                    if (header.name && header.value) {
                        options.headers[header.name] = header.value;
                    }
                });

                // Adicionar header params do DTO
                for (const [name, value] of Object.entries(this.headerParamValues)) {
                    if (value !== undefined && value !== null && value !== '') {
                        options.headers[name] = value;
                    }
                }

                // Adicionar token de autenticação se disponível
                if (this.isAuthenticated && this.authData.token) {
                    options.headers['Authorization'] = `Bearer ${this.authData.token}`;
                }

                // Adicionar body para métodos que o suportam
                if (['POST', 'PUT', 'PATCH'].includes(method) && this.bodyParams.length > 0) {
                    if (!options.headers['Content-Type']) {
                        options.headers['Content-Type'] = 'application/json';
                    }
                    options.body = JSON.stringify(this.requestFormData);
                }

                const startTime = Date.now();

                const response = await fetch(this.fullRequestUrl, options);
                this.responseStatus = response.status;
                this.responseTime = Date.now() - startTime;
                this.showResponse = true;

                const contentType = response.headers.get('Content-Type') || '';
                let responseText = await response.text();

                if (contentType.includes('application/json') ||
                    responseText.trim().startsWith('{') ||
                    responseText.trim().startsWith('[')) {
                    try {
                        const responseData = JSON.parse(responseText);
                        this.responseText = JSON.stringify(responseData, null, 2);
                    } catch (e) {
                        this.responseText = responseText;
                    }
                } else {
                    this.responseText = responseText;
                }

                if (response.status >= 200 && response.status < 300) {
                    this.requestStatus = {
                        type: 'success',
                        message: `${response.status} ${response.statusText}`
                    };
                } else {
                    this.requestStatus = {
                        type: 'error',
                        message: `${response.status} ${response.statusText}`
                    };
                }

                // Alternar para a aba de Response automaticamente após receber a resposta
                this.mainTab = 'response';
            } catch (error) {
                this.responseStatus = 0;
                this.responseTime = 0;
                this.showResponse = true;
                this.responseText = `Error: ${error.message}`;
                this.requestStatus = {
                    type: 'error',
                    message: 'Network Error'
                };
            } finally {
                this.isLoading = false;
            }
        },

        generateSampleBody() {
            if (!this.bodyParams.length) return;

            const sample = {};
            for (const param of this.bodyParams) {
                if (param.type === 'json') {
                    sample[param.name] = { sample: "value" };
                } else {
                    sample[param.name] = this.getDefaultValueForType(param.type);
                }
            }

            this.requestFormData = sample;
        },

        clearResponse() {
            this.showResponse = false;
            this.responseText = '';
            this.responseStatus = 0;
            this.responseTime = 0;
        },

        clearRequestBody() {
            this.requestFormData = {};

            if (this.selectedEndpoint === 'create' || this.selectedEndpoint === 'update') {
                this.selectedContract.fields.forEach(field => {
                    if (!field.readOnly) {
                        this.requestFormData[field.propertyKey] = this.getDefaultValueForType(field.protoType);
                    }
                });
            } else if (this.selectedEndpoint.startsWith('custom_') && this.currentRequestDTO) {
                const dto = this.selectedContract.messages.find(m => m.name === this.currentRequestDTO);
                if (dto && dto.properties) {
                    for (const [key, prop] of Object.entries(dto.properties)) {
                        this.requestFormData[key] = this.getDefaultValueForType(prop.type);
                    }
                }
            }
        },

        generateSampleValueForType(type) {
            switch(type) {
                case 'string':
                    const samples = ['Example value', 'Sample text', 'Test string', 'Lorem ipsum'];
                    return samples[Math.floor(Math.random() * samples.length)];
                case 'bool': return Math.random() > 0.5;
                case 'int':
                case 'int32':
                case 'int64': return Math.floor(Math.random() * 100);
                case 'float':
                case 'double': return parseFloat((Math.random() * 100).toFixed(2));
                case 'simpleArray': return Array(3).fill(null).map(() => `Item ${Math.floor(Math.random() * 10)}`);
                case 'json': return { sample: 'data', nested: { value: Math.random() > 0.5 } };
                case 'date': return new Date().toISOString().split('T')[0];
                case 'time':
                    return new Date().toTimeString().split(' ')[0];
                case 'timestamp':
                    return new Date().toISOString();
                case 'bytes':
                    return '';
                case 'any':
                    return null;
                default: return null;
            }
        },

        get hasUrlParams() {
            return this.urlParams.length > 0;
        },

        get urlParams() {
            if (!this.selectedEndpoint) return [];

            if (this.selectedEndpoint === 'getById' || this.selectedEndpoint === 'update' || this.selectedEndpoint === 'delete') {
                return ['id'];
            }

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                const service = this.selectedContract.services[serviceIndex];

                if (service && service.path) {
                    const params = [];
                    const paramRegex = /:([a-zA-Z0-9_]+)/g;
                    let match;
                    const path = service.path.toString();

                    while ((match = paramRegex.exec(path)) !== null) {
                        params.push(match[1]);
                    }

                    return params;
                }
            }

            return [];
        },

        getCurrentMethod() {
            if (!this.selectedEndpoint)
                return 'GET';

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);

                if (!this.selectedContract || !this.selectedContract.services)
                    return 'GET';

                const service = this.selectedContract.services[serviceIndex];

                if (!service)
                    return 'GET';

                const method = service.method || '';

                if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(method))
                    return method;

                return 'GET';
            }

            switch (this.selectedEndpoint) {
                case 'getAll':
                case 'getById':
                case 'getIn':
                    return 'GET';
                case 'create':
                    return 'POST';
                case 'update':
                    return 'PUT';
                case 'delete':
                    return 'DELETE';
                default:
                    console.warn('Endpoint não reconhecido:', this.selectedEndpoint);
                    return 'GET';
            }
        },

        getCurrentPath() {
            if (!this.selectedContract) return '';

            const basePath = this.selectedContract.controllerCustomPath ||
                            (this.selectedContract.controllerName ?
                             this.selectedContract.controllerName.toLowerCase() : '');

            if (!basePath) return '';

            if (!this.selectedEndpoint) return `/${basePath}`;

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                const service = this.selectedContract.services[serviceIndex];

                if (!service) return `/${basePath}`;

                let servicePath = service.path || '';
                const urlParams = this.urlParams || [];

                if (servicePath.startsWith('/') || servicePath.includes('/')) {
                    if (servicePath.startsWith('/')) {
                        servicePath = servicePath.substring(1);
                    }

                    if (urlParams.length > 0) {
                        urlParams.forEach(param => {
                            const placeholder = `:${param}`;
                            if (servicePath.includes(placeholder)) {
                                const value = this.paramValues[param] || placeholder;
                                servicePath = servicePath.replace(placeholder, value);
                            }
                        });
                    }

                    return `/${servicePath}`;
                }

                if (urlParams.length > 0) {
                    urlParams.forEach(param => {
                        const placeholder = `:${param}`;
                        if (servicePath.includes(placeholder)) {
                            const value = this.paramValues[param] || placeholder;
                            servicePath = servicePath.replace(placeholder, value);
                        }
                    });
                }

                return `/${basePath}/${servicePath}`;
            }

            switch (this.selectedEndpoint) {
                case 'getAll':
                    let queryParts = [];

                    if (this.queryParams.limit) {
                        queryParts.push(`limit=${encodeURIComponent(this.queryParams.limit)}`);
                    }

                    if (this.queryParams.offset || this.queryParams.offset === 0) {
                        queryParts.push(`offset=${encodeURIComponent(this.queryParams.offset)}`);
                    }

                    if (this.queryParams.sortBy) {
                        queryParts.push(`sortBy=${encodeURIComponent(this.queryParams.sortBy)}`);
                    }

                    if (this.queryParams.sort) {
                        queryParts.push(`sort=${encodeURIComponent(this.queryParams.sort)}`);
                    }

                    if (this.queryParams.search) {
                        queryParts.push(`search=${encodeURIComponent(this.queryParams.search)}`);
                    }

                    if (this.queryParams.searchField) {
                        queryParts.push(`searchField=${encodeURIComponent(this.queryParams.searchField)}`);
                    }

                    if (this.queryParams.filtersJson) {
                        try {
                            const filters = JSON.parse(this.queryParams.filtersJson);
                            queryParts.push(`filters=${encodeURIComponent(JSON.stringify(filters))}`);
                        } catch (error) {}
                    }

                    if (queryParts.length > 0) {
                        const queryString = queryParts.join('&');
                        return `/${basePath}${queryString ? `?${queryString}` : ''}`;
                    }
                    return `/${basePath}`;

                case 'getById':
                    const id = this.paramValues.id || ':id';
                    return `/${basePath}/${id}`;

                case 'getIn':
                    return `/${basePath}/in?ids=${this.queryParams.ids || ':ids'}`;

                case 'create':
                    return `/${basePath}`;

                case 'update':
                    const updateId = this.paramValues.id || ':id';
                    return `/${basePath}/${updateId}`;

                case 'delete':
                    const deleteId = this.paramValues.id || ':id';
                    return `/${basePath}/${deleteId}`;

                default:
                    return `/${basePath}`;
            }
        },

        get currentAuth() {
            if (!this.selectedEndpoint) return false;

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                return this.selectedContract.services[serviceIndex]?.auth || false;
            }

            return this.selectedContract.auth === true;
        },

        hasController() {
            return this.selectedContract &&
                   (this.selectedContract.generateController === true ||
                    this.selectedContract.generateController === 'true');
        },

        updateFullRequestUrl() {
            if (!this.selectedEndpoint || !this.selectedContract) return;

            // Construir a URL base
            const basePath = this.selectedContract.controllerCustomPath ||
                            (this.selectedContract.controllerName ?
                             this.selectedContract.controllerName.toLowerCase() : '');

            let path = '';

            // Construir o caminho com base no endpoint selecionado
            if (this.selectedEndpoint.startsWith('custom_')) {
                // Para métodos customizados
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                const service = this.selectedContract.services[serviceIndex];

                if (service) {
                    let servicePath = service.path || '';

                    // Substituir parâmetros de path
                    for (const param of this.pathParams) {
                        const placeholder = `:${param.name}`;
                        if (servicePath.includes(placeholder)) {
                            // Se o valor estiver preenchido, substituir com valor codificado
                            // Caso contrário, manter o placeholder como está (sem codificar)
                            if (this.paramValues[param.name]) {
                                servicePath = servicePath.replace(
                                    placeholder,
                                    this.paramValues[param.name]  // Sem encode para manter o formato :param
                                );
                            }
                        }
                    }

                    // CORREÇÃO: Usar o path explícito do contrato diretamente
                    // Remover barra inicial se existir
                    path = servicePath.startsWith('/') ? servicePath.substring(1) : servicePath;
                } else {
                    path = basePath; // Fallback para o basePath se o serviço não for encontrado
                }
            } else {
                // Para endpoints CRUD padrão
                switch (this.selectedEndpoint) {
                    case 'getAll':
                        path = basePath;
                        break;
                    case 'getById':
                        // Manter o placeholder se não houver valor
                        const idValue = this.paramValues.id;
                        path = idValue ?
                            `${basePath}/${idValue}` :
                            `${basePath}/:id`;
                        break;
                    case 'getIn':
                        path = `${basePath}/in`;
                        break;
                    case 'create':
                        path = basePath;
                        break;
                    case 'update':
                        // Manter o placeholder se não houver valor
                        const updateId = this.paramValues.id;
                        path = updateId ?
                            `${basePath}/${updateId}` :
                            `${basePath}/:id`;
                        break;
                    case 'delete':
                        // Manter o placeholder se não houver valor
                        const deleteId = this.paramValues.id;
                        path = deleteId ?
                            `${basePath}/${deleteId}` :
                            `${basePath}/:id`;
                        break;
                    default:
                        path = basePath;
                }
            }

            // Adicionar parâmetros de query (apenas os preenchidos)
            const queryParams = [];
            for (const param of this.queryParams) {
                const value = this.queryParamValues[param.name];

                // Apenas adicionar se o valor existir e não for vazio
                if (value !== undefined && value !== null && value !== '') {
                    // Tratamento especial para o parâmetro "filters"
                    if (param.name === 'filters' || param.type === 'json') {
                        try {
                            // Tentar parsear o JSON antes de adicionar à URL
                            const parsedValue = typeof value === 'string' ?
                                (value.trim() ? JSON.parse(value) : {}) :
                                value;

                            if (Object.keys(parsedValue).length > 0) {
                                const jsonStr = JSON.stringify(parsedValue);
                                queryParams.push(`${param.name}=${encodeURIComponent(jsonStr)}`);
                            }
                        } catch (e) {
                            // Se não for um JSON válido, não adicionar à URL
                            console.warn(`Invalid JSON for param ${param.name}:`, e);
                        }
                    } else {
                        queryParams.push(`${param.name}=${encodeURIComponent(value)}`);
                    }
                }
            }

            // Montar a URL final
            let url = `${this.apiBaseUrl}/${path}`;
            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            this.fullRequestUrl = url;
        },

        checkScreenSize() {
            this.isMobile = window.innerWidth < 1024;

            if (this.isMobile) {
                this.sidebarOpen = false;
                this.apiSidebarOpen = false;
            } else {
                this.sidebarOpen = true;
                this.apiSidebarOpen = true;
            }
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },

        toggleApiSidebar() {
            this.apiSidebarOpen = !this.apiSidebarOpen;
        },

        toggleAuthModal() {
            this.showAuthModal = !this.showAuthModal;
        },

        saveToken() {
            if (this.bearerToken) {
                this.authData.token = this.bearerToken;
                this.saveAuthDataToStorage();
                this.showAuthModal = false;
                this.bearerToken = '';
            }
        },

        async login() {
            if (!this.loginCredentials.username || !this.loginCredentials.password) {
                return;
            }

            this.isLoggingIn = true;

            try {
                const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.loginCredentials.username,
                        password: this.loginCredentials.password
                    })
                });

                const data = await response.json();

                if (response.ok && data.result && data.result.token) {
                    this.authData.token = data.result.token;
                    if (data.result.refreshToken) {
                        this.authData.refreshToken = data.result.refreshToken;
                    }

                    this.saveAuthDataToStorage();
                    this.showAuthModal = false;
                    this.loginCredentials = { username: '', password: '' };
                } else {
                    alert('Authentication failed. Please check your credentials.');
                }
            } catch (error) {
                alert('Authentication error. Please try again later.');
            } finally {
                this.isLoggingIn = false;
            }
        },

        logout() {
            this.authData = { token: '', refreshToken: '' };
            localStorage.removeItem('apiExplorerAuth');
            this.showAuthModal = false;
        },

        saveAuthDataToStorage() {
            localStorage.setItem('apiExplorerAuth', JSON.stringify(this.authData));
        },

        loadAuthDataFromStorage() {
            const storedAuth = localStorage.getItem('apiExplorerAuth');
            if (storedAuth) {
                try {
                    this.authData = JSON.parse(storedAuth);
                } catch (e) {
                    this.authData = { token: '', refreshToken: '' };
                }
            }
        },

        getDefaultValueForType(type) {
            switch(type) {
                case 'string':
                case 'text':
                case 'uuid':
                    return '';
                case 'boolean':
                case 'bool':
                    return false;
                case 'int':
                case 'int32':
                case 'int64':
                case 'uint32':
                case 'uint64':
                case 'fixed32':
                case 'fixed64':
                case 'bigint':
                    return 0;
                case 'float':
                case 'double':
                case 'number':
                    return 0.0;
                case 'simpleArray':
                    return [];
                case 'json':
                    return {};
                case 'date':
                    return new Date().toISOString().split('T')[0];
                case 'time':
                    return new Date().toTimeString().split(' ')[0];
                case 'timestamp':
                    return new Date().toISOString();
                case 'bytes':
                    return '';
                case 'any':
                    return null;
                default:
                    return null;
            }
        },

        processRequestParameters() {
            this.pathParams = [];
            this.queryParams = [];
            this.bodyParams = [];
            this.headerParams = [];
            this.paramValues = {};
            this.queryParamValues = {};
            this.headerParamValues = {};
            this.requestFormData = {};

            if (!this.selectedEndpoint) return;

            if (this.selectedEndpoint === 'getById' || this.selectedEndpoint === 'update' || this.selectedEndpoint === 'delete') {
                this.pathParams.push({ name: 'id', type: 'string', required: true });
            }

            if (this.selectedEndpoint === 'getAll') {
                this.queryParams = [
                    { name: 'limit', type: 'int' },
                    { name: 'offset', type: 'int' },
                    { name: 'sortBy', type: 'string' },
                    { name: 'sort', type: 'string' },
                    { name: 'search', type: 'string' },
                    { name: 'searchField', type: 'string' },
                    { name: 'filters', type: 'json' }
                ];
            }

            if (this.selectedEndpoint === 'getIn') {
                this.queryParams.push({ name: 'ids', type: 'string', required: true });
            }

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                const service = this.selectedContract.services[serviceIndex];

                if (service) {
                    const pathRegex = /:([a-zA-Z0-9_]+)/g;
                    let pathMatch;
                    const path = service.path || '';

                    while ((pathMatch = pathRegex.exec(path)) !== null) {
                        this.pathParams.push({
                            name: pathMatch[1],
                            type: 'string',
                            required: true
                        });
                    }

                    const requestDTO = this.selectedContract.messages.find(m => m.name === service.request);
                    this.currentRequestDTO = service.request;

                    if (requestDTO && requestDTO.properties) {
                        for (const [propName, prop] of Object.entries(requestDTO.properties)) {
                            const paramType = prop.paramType || 'body';
                            const paramInfo = {
                                name: propName,
                                type: prop.type || 'string',
                                required: !!prop.required
                            };

                            switch (paramType.toLowerCase()) {
                                case 'path':
                                    if (!this.pathParams.some(p => p.name === propName)) {
                                        this.pathParams.push(paramInfo);
                                    }
                                    break;
                                case 'query':
                                    this.queryParams.push(paramInfo);
                                    break;
                                case 'header':
                                    this.headerParams.push(paramInfo);
                                    break;
                                case 'body':
                                default:
                                    this.bodyParams.push(paramInfo);
                                    break;
                            }
                        }
                    }
                }
            }

            if ((this.selectedEndpoint === 'create' || this.selectedEndpoint === 'update') &&
                this.selectedContract.fields) {

                this.bodyParams = this.selectedContract.fields
                    .filter(field => !field.readOnly)
                    .map(field => ({
                        name: field.propertyKey,
                        type: field.protoType || 'string',
                        required: !field.nullable && !field.defaultValue
                    }));
            }

            this.pathParams.forEach(param => {
                this.paramValues[param.name] = this.getDefaultValueForType(param.type);
            });

            this.queryParams.forEach(param => {
                if (param.name === 'filters' || param.type === 'json') {
                    this.queryParamValues[param.name] = '{}';
                } else {
                    this.queryParamValues[param.name] = '';
                }
            });

            this.headerParams.forEach(param => {
                this.headerParamValues[param.name] = this.getDefaultValueForType(param.type);
            });

            this.bodyParams.forEach(param => {
                this.requestFormData[param.name] = this.getDefaultValueForType(param.type);
            });

            this.updateFullRequestUrl();

            this.$nextTick(() => {
                if (this.pathParams.length > 0 || this.queryParams.length > 0) {
                    this.requestTab = 'params';
                } else if (this.bodyParams.length > 0) {
                    this.requestTab = 'body';
                } else {
                    this.requestTab = 'headers';
                }
            });
        },

        escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        copyResponseToClipboard() {
            if (!this.responseText) return;

            navigator.clipboard.writeText(this.responseText)
                .then(() => {
                    this.copyStatus = true;
                    setTimeout(() => {
                        this.copyStatus = false;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erro ao copiar para o clipboard:', err);
                });
        },

        filterContracts() {
            if (!this.schema) {
                this.filteredContracts = {};
                return;
            }

            if (!this.contractFilter || this.contractFilter.trim() === '') {
                this.filteredContracts = this.schema;
                return;
            }

            const searchTerm = this.contractFilter.toLowerCase().trim();
            const filtered = {};

            for (const [key, contract] of Object.entries(this.schema)) {
                if (contract.controllerName.toLowerCase().includes(searchTerm) ||
                    contract.contractName.toLowerCase().includes(searchTerm)) {
                    filtered[key] = contract;
                }
            }

            this.filteredContracts = filtered;
        },

        getUnsyncedContracts() {
            const unsyncedContracts = [];

            for (const key in this.schema) {
                const contract = this.schema[key];

                if (!contract.sync &&
                    !contract.options?.moduleContract) {
                    unsyncedContracts.push({
                        key: key,
                        name: contract.contractName || key,
                        status: 'Modified',
                        state: 'pending'
                    });
                }
            }

            return unsyncedContracts;
        },

        openSyncModal() {
            this.contractsToSync = this.getUnsyncedContracts();
            this.syncInProgress = false;
            this.syncProgress = 0;
            this.syncModalOpen = true;
        },

        async startSyncProcess() {
            if (this.contractsToSync.length === 0) return;

            this.ignoreContractChanges = true;
            this.recentlySyncedContracts.clear();

            this.syncInProgress = true;
            this.syncProgress = 0;

            this.contractsToSync.forEach(contract => {
                contract.state = 'pending';
            });

            let index = 0;
            const processNextContract = async () => {
                if (index < this.contractsToSync.length) {
                    const contract = this.contractsToSync[index];
                    contract.state = 'processing';

                    try {
                        const contractData = this.schema[contract.key];

                        const response = await fetch('/sandbox/compile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(contractData)
                        });

                        if (response.ok) {
                            contract.state = 'completed';

                            if (this.schema[contract.key]) {
                                this.recentlySyncedContracts.add(contract.key);
                                this.schema[contract.key].sync = true;

                                const newHash = await this.generateContractHash(this.schema[contract.key]);
                                const hashes = this.loadContractHashes();
                                hashes[contract.key] = newHash;
                                this.saveContractHashes(hashes);
                            }
                        } else {
                            const errorData = await response.json();
                            console.error(`Erro ao compilar contrato ${contract.name}:`, errorData);
                            contract.state = 'error';
                            contract.error = errorData.message || 'Unknown error during compilation';
                        }
                    } catch (error) {
                        console.error(`Erro ao sincronizar contrato ${contract.name}:`, error);
                        contract.state = 'error';
                        contract.error = error.message || 'Network error during synchronization';
                    }

                    this.syncProgress = Math.round(((index + 1) / this.contractsToSync.length) * 100);
                    index++;

                    await processNextContract();
                } else {
                    const hasErrors = this.contractsToSync.some(c => c.state === 'error');
                    localStorage.setItem("schema", JSON.stringify(this.schema));

                    this.syncInProgress = false;
                    this.syncModalOpen = false;

                    setTimeout(() => {
                        this.ignoreContractChanges = false;
                    }, 500);
                }
            };

            await processNextContract();
        },

        generateContractHash(contract) {
            try {
                const contractCopy = JSON.parse(JSON.stringify(contract));

                delete contractCopy.sync;
                delete contractCopy._tempId;
                delete contractCopy._lastUpdated;

                this.normalizeValues(contractCopy);

                const orderedContract = this.sortObjectKeys(contractCopy);

                const contractString = JSON.stringify(orderedContract, (key, value) => {
                    if (value instanceof Date)
                        return value.toISOString();

                    if (typeof value === 'number' && !isFinite(value))
                        return `"__NON_SERIALIZABLE_${value.toString()}__"`;

                    return value;
                });

                return this.sha256(contractString);
            } catch (error) {
                console.error('Erro ao gerar hash do contrato:', error);
                return this.simpleSha256(JSON.stringify(contract));
            }
        },

        normalizeValues(obj) {
            if (!obj || typeof obj !== 'object') return;

            if (Array.isArray(obj)) {
                obj.forEach(item => this.normalizeValues(item));
                return;
            }

            for (const key in obj) {
                if (obj[key] === undefined) {
                    obj[key] = null;
                } else if (obj[key] === '') {
                    // Manter strings vazias
                } else if (obj[key] === 0 || obj[key] === false) {
                    // Manter zeros e falsos
                } else if (!obj[key] && obj[key] !== 0 && obj[key] !== false) {
                    // Normalizar outros valores "falsy" para null
                    obj[key] = null;
                } else if (typeof obj[key] === 'object') {
                    this.normalizeValues(obj[key]);
                }
            }
        },

        sortObjectKeys(obj) {
            if (obj === null || typeof obj !== 'object')
                return obj;

            if (Array.isArray(obj))
                return obj.map(item => this.sortObjectKeys(item));

            const sortedObj = {};

            Object.keys(obj).sort().forEach(key => {
                sortedObj[key] = this.sortObjectKeys(obj[key]);
            });

            return sortedObj;
        },

        async sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        },

        simpleSha256(str) {
            let hash = 0;
            if (str.length === 0) return hash.toString(16);

            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }

            return Math.abs(hash).toString(16);
        },

        loadContractHashes() {
            try {
                const storedHashes = localStorage.getItem('contractHashes');
                return storedHashes ? JSON.parse(storedHashes) : {};
            } catch (e) {
                console.error('Erro ao carregar hashes dos contratos:', e);
                return {};
            }
        },

        saveContractHashes(hashes) {
            try {
                localStorage.setItem('contractHashes', JSON.stringify(hashes));
            } catch (e) {
                console.error('Erro ao salvar hashes dos contratos:', e);
            }
        },

        async detectAndMarkChangedContracts(schema) {
            try {
                const storedHashes = this.loadContractHashes();
                const updatedContracts = [];

                for (const key in schema) {
                    if (schema[key].options?.moduleContract)
                        continue;

                    const newHash = await this.generateContractHash(schema[key]);

                    if (storedHashes[key] && storedHashes[key] !== newHash) {
                        console.log(`Contrato alterado: ${key}`);
                        schema[key].sync = false;
                        updatedContracts.push(key);
                        storedHashes[key] = newHash;
                    }
                    else if (!storedHashes[key]) {
                        console.log(`Novo contrato: ${key}`);
                        schema[key].sync = false;
                        updatedContracts.push(key);
                        storedHashes[key] = newHash;
                    }
                }

                if (updatedContracts.length > 0)
                    this.saveContractHashes(storedHashes);

                return updatedContracts;
            } catch (error) {
                console.error('Erro ao detectar alterações nos contratos:', error);
                return [];
            }
        },

        async updateContractSyncStatus(key) {
            if (!this.schema[key]) return;

            try {
                const contract = this.schema[key];
                const oldHash = this.loadContractHashes()[key];
                const newHash = await this.generateContractHash(contract);

                if (oldHash !== newHash) {
                    contract.sync = false;

                    const hashes = this.loadContractHashes();
                    hashes[key] = newHash;
                    this.saveContractHashes(hashes);
                    this.schemaToLocalStorege();

                    console.log(`Contrato ${key} marcado como não sincronizado`);
                    return true;
                }
            } catch (e) {
                console.error(`Erro ao atualizar status de sincronização do contrato ${key}:`, e);
            }

            return false;
        },

        async checkContractsForChanges() {
            try {
                const contractHashes = this.loadContractHashes();
                const currentHashes = {};
                let hasChanges = false;

                for (const [key, contract] of Object.entries(this.schema)) {
                    try {
                        if (contract.options?.moduleContract)
                            continue;

                        const currentHash = await this.generateContractHash(contract);
                        currentHashes[key] = currentHash;

                        if (contractHashes[key] && contractHashes[key] !== currentHash) {
                            console.log(`Contrato ${key} foi modificado`);
                            contract.sync = false;
                            hasChanges = true;
                        }
                        else if (!contractHashes[key]) {
                            console.log(`Novo contrato detectado: ${key}`);
                            contract.sync = false;
                            hasChanges = true;
                        }
                    } catch (e) {
                        console.error(`Erro ao verificar mudanças no contrato ${key}:`, e);
                    }
                }

                this.saveContractHashes(currentHashes);

                if (hasChanges) {
                    this.ignoreContractChanges = true;
                    this.schemaToLocalStorege();
                    setTimeout(() => {
                        this.ignoreContractChanges = false;
                    }, 500);
                }

                return hasChanges;
            } catch (e) {
                console.error('Erro ao verificar mudanças nos contratos:', e);
                return false;
            }
        }
    }
}).mount('#app')
