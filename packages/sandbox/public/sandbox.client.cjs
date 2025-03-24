const { createApp, vue } = Vue;

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
            selectedMasterTab: 0,
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
                { label: "Data", active: false },
                { label: "Form Builder", active: false },
            ],
            tabsMaster: [
                { label: "Contract", active: true },
                { label: "GraphQL", active: false },
                { label: "Logs", active: false },
                { label: "Backup", active: false },
                { label: "Modules", active: false },
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
                // String validations
                "IsString": { key: "IsString", label: "Is String" },
                "MinLength": { key: "MinLength", label: "Min Length" },
                "MaxLength": { key: "MaxLength", label: "Max Length" },
                "Length": { key: "Length", label: "Length" },
                "Matches": { key: "Matches", label: "Matches Regex" },
                "IsEmail": { key: "IsEmail", label: "Is Email" },
                "IsUUID": { key: "IsUUID", label: "Is UUID" },
                "IsAlpha": { key: "IsAlpha", label: "Is Alpha" },
                "IsAlphanumeric": { key: "IsAlphanumeric", label: "Is Alphanumeric" },
                "IsUrl": { key: "IsUrl", label: "Is URL" },
                "IsStrongPassword": { key: "IsStrongPassword", label: "Strong Password" },
                "IsFQDN": { key: "IsFQDN", label: "Is FQDN" },
                "IsHexColor": { key: "IsHexColor", label: "Is Hex Color" },
                "IsLowercase": { key: "IsLowercase", label: "Is Lowercase" },
                "IsUppercase": { key: "IsUppercase", label: "Is Uppercase" },

                // Number validations
                "IsNumber": { key: "IsNumber", label: "Is Number" },
                "IsInt": { key: "IsInt", label: "Is Integer" },
                "IsPositive": { key: "IsPositive", label: "Is Positive" },
                "IsNegative": { key: "IsNegative", label: "Is Negative" },
                "Min": { key: "Min", label: "Min Value" },
                "Max": { key: "Max", label: "Max Value" },
                "IsDecimal": { key: "IsDecimal", label: "Is Decimal" },
                "IsDivisibleBy": { key: "IsDivisibleBy", label: "Is Divisible By" },

                // Date validations
                "IsDate": { key: "IsDate", label: "Is Date" },
                "IsISO8601": { key: "IsISO8601", label: "Is ISO 8601 Date" },
                "MinDate": { key: "MinDate", label: "Min Date" },
                "MaxDate": { key: "MaxDate", label: "Max Date" },

                // Array validations
                "IsArray": { key: "IsArray", label: "Is Array" },
                "ArrayMinSize": { key: "ArrayMinSize", label: "Array Min Size" },
                "ArrayMaxSize": { key: "ArrayMaxSize", label: "Array Max Size" },
                "ArrayContains": { key: "ArrayContains", label: "Array Contains" },
                "ArrayNotContains": { key: "ArrayNotContains", label: "Array Not Contains" },
                "ArrayUnique": { key: "ArrayUnique", label: "Array Unique" },

                // Object validations
                "IsObject": { key: "IsObject", label: "Is Object" },
                "IsJSON": { key: "IsJSON", label: "Is JSON" },
                "IsMongoId": { key: "IsMongoId", label: "Is Mongo ID" },
                "ValidateNested": { key: "ValidateNested", label: "Validate Nested" },
                "IsInstance": { key: "IsInstance", label: "Is Instance" },

                // Boolean validations
                "IsBoolean": { key: "IsBoolean", label: "Is Boolean" },

                // Special validations
                "Equals": { key: "Equals", label: "Equals" },
                "NotEquals": { key: "NotEquals", label: "Not Equals" },
                "IsEmpty": { key: "IsEmpty", label: "Is Empty" },
                "IsNotEmpty": { key: "IsNotEmpty", label: "Is Not Empty" },
                "IsDefined": { key: "IsDefined", label: "Is Defined" },
                "IsOptional": { key: "IsOptional", label: "Is Optional" },

                // Network validations
                "IsIP": { key: "IsIP", label: "Is IP Address" },
                "IsMACAddress": { key: "IsMACAddress", label: "Is MAC Address" },
                "IsPort": { key: "IsPort", label: "Is Port" },

                // Misc validations
                "IsEnum": { key: "IsEnum", label: "Is Enum" },
                "IsLatitude": { key: "IsLatitude", label: "Is Latitude" },
                "IsLongitude": { key: "IsLongitude", label: "Is Longitude" },
                "IsPostalCode": { key: "IsPostalCode", label: "Is Postal Code" },
                "IsMilitaryTime": { key: "IsMilitaryTime", label: "Is Military Time" },
                "IsTimeZone": { key: "IsTimeZone", label: "Is Time Zone" },
                "IsISRC": { key: "IsISRC", label: "Is ISRC" },
                "IsDataURI": { key: "IsDataURI", label: "Is Data URI" },
                "IsBase64": { key: "IsBase64", label: "Is Base64" },
                "IsJWT": { key: "IsJWT", label: "Is JWT" },
                "IsBtcAddress": { key: "IsBtcAddress", label: "Is BTC Address" },
                "IsEthereumAddress": { key: "IsEthereumAddress", label: "Is Ethereum Address" },
                "IsCreditCard": { key: "IsCreditCard", label: "Is Credit Card" },
                "IsISBN": { key: "IsISBN", label: "Is ISBN" },
                "IsLocale": { key: "IsLocale", label: "Is Locale" },
                "IsMimeType": { key: "IsMimeType", label: "Is MIME Type" },
                "IsSemVer": { key: "IsSemVer", label: "Is SemVer" }
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
            dataTable: null,
            logViewer: null,
            formBuilder: null,
            backupViewer: null,
            modulesViewer: null,
            syncModalOpen: false,
            syncInProgress: false,
            syncProgress: 0,
            contractsToSync: [],
            ignoreContractChanges: false,
            recentlySyncedContracts: new Set(),
            modalDeleteContract: false,
            confirmContractName: '',
            isDeleting: false,
            tabDropdownOpen: false,
            canScrollLeft: false,
            canScrollRight: false,
            pendingDataTableRefresh: false,
            contractTab: 'contract',
            functionalTabDropdownOpen: false,
            linkedEntities: {},
            loadingLinks: {},
            authModalCallback: null
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
                if (this.responseText.trim().startsWith('{') || this.responseText.trim().startsWith('[')) {
                    const parsedJson = JSON.parse(this.responseText);
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    return hljs.highlight(formattedJson, { language: 'json' }).value;
                }

                return this.escapeHtml(this.responseText);
            } catch (e) {
                return this.escapeHtml(this.responseText);
            }
        },

        completedCount() {
            return this.contractsToSync.filter(c => c.state === 'completed').length;
        },

        availableContracts() {
            if (!this.schema) return [];

            return Object.values(this.schema).filter(contract =>
                contract.controllerName !== this.selectedContract?.controllerName &&
                !contract.directMessage
            );
        },

        contractTabLabel() {
            const labels = {
                'contract': 'Contract',
                'schema': 'Schema',
                'logs': 'Logs',
                'backup': 'Backup'
            };
            return labels[this.contractTab] || 'Contract';
        }
    },

    mounted() {
        this.connectWebSocket();
        this.getSchema();

        const selectedTab = localStorage.getItem('selectedTab');
        const selectedMasterTab = localStorage.getItem('selectedMasterTab');
        const hiddenModuleContracts = localStorage.getItem('hiddenModuleContracts');
        const sidebarState = localStorage.getItem('sidebarOpen');

        this.selectedTab = Number(selectedTab) ?? 0;
        this.selectedMasterTab = Number(selectedMasterTab) ?? 0;
        this.hiddenModuleContracts = (hiddenModuleContracts === 'true');
        this.sidebarOpen = sidebarState === null ? true : sidebarState === 'true';

        if (!this.apiBaseUrl || this.apiBaseUrl === 'null' || this.apiBaseUrl === 'undefined')
            this.apiBaseUrl = window.location.origin;

        this.checkScreenSize();
        window.addEventListener('resize', this.checkScreenSize);
        window.addEventListener('resize', this.checkTabOverflow);

        this.loadAuthDataFromStorage();

        this.filteredContracts = this.schema;

        this.graphql = useGraphQLExplorer();
        this.graphql.fetchSchema();
        this.graphql.initQueryEditor();

        this.dataTable = useDataTable();
        this.dataTable.init(this.selectedContract, this.schema);
        this.dataTable.setAuthErrorHandler(this.handleDataTableAuthError.bind(this));

        this.logViewer = useLogViewer();
        this.formBuilder = useFormBuilder();
        this.formBuilder.init(this.selectedContract);

        this.backupViewer = useBackupViewer();
        this.modulesViewer = useModulesViewer();

        this.$nextTick(() => {
            this.checkTabOverflow();
        });

        document.addEventListener('click', this.handleClickOutside);

        this.initLinkedEntities();
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.checkScreenSize);
        window.removeEventListener('resize', this.checkTabOverflow);
        document.removeEventListener('click', this.handleClickOutside);
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

                    this.$nextTick(() => {
                        this.initLinkedEntities();
                    });
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
        },
        sidebarOpen: {
            handler(newState) {
                localStorage.setItem("sidebarOpen", newState);
            },
            immediate: true
        }
    },

    methods: {
        connectWebSocket(reload = false) {
            const port = document.querySelector("#wsPort").getAttribute("wsPort");
            this.socket = new WebSocket(`ws://localhost:${port}`);

            this.socket.addEventListener("message", (message) => {
                const messageData = JSON.parse(message.data);
                this.parseMesssage(messageData);
            });

            this.socket.addEventListener("open", () => {
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
            if (this.selectedContract) {
                await this.updateContractSyncStatus(Object.keys(this.schema).find(k =>
                    this.schema[k].contractName === this.selectedContract.contractName));
            }

            this.selectedContract = this.schema[key];
            localStorage.setItem('selectedContract', key);

            this.dataTable.init(this.selectedContract);
            this.formBuilder.init(this.selectedContract);

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

                this.headers.forEach(header => {
                    if (header.name && header.value) {
                        options.headers[header.name] = header.value;
                    }
                });

                for (const [name, value] of Object.entries(this.headerParamValues)) {
                    if (value !== undefined && value !== null && value !== '') {
                        options.headers[name] = value;
                    }
                }

                if (this.isAuthenticated && this.authData.token) {
                    options.headers['Authorization'] = `Bearer ${this.authData.token}`;
                }

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

            const basePath = this.selectedContract.controllerCustomPath ||
                            (this.selectedContract.controllerName ?
                             this.selectedContract.controllerName.toLowerCase() : '');

            let path = '';

            if (this.selectedEndpoint.startsWith('custom_')) {
                const serviceIndex = parseInt(this.selectedEndpoint.split('_')[1]);
                const service = this.selectedContract.services[serviceIndex];

                if (service) {
                    let servicePath = service.path || '';

                    for (const param of this.pathParams) {
                        const placeholder = `:${param.name}`;
                        if (servicePath.includes(placeholder)) {
                            if (this.paramValues[param.name]) {
                                servicePath = servicePath.replace(
                                    placeholder,
                                    this.paramValues[param.name]
                                );
                            }
                        }
                    }

                    path = servicePath.startsWith('/') ? servicePath.substring(1) : servicePath;
                } else {
                    path = basePath;
                }
            } else {
                switch (this.selectedEndpoint) {
                    case 'getAll':
                        path = basePath;
                        break;
                    case 'getById':
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
                        const updateId = this.paramValues.id;
                        path = updateId ?
                            `${basePath}/${updateId}` :
                            `${basePath}/:id`;
                        break;
                    case 'delete':
                        const deleteId = this.paramValues.id;
                        path = deleteId ?
                            `${basePath}/${deleteId}` :
                            `${basePath}/:id`;
                        break;
                    default:
                        path = basePath;
                }
            }

            const queryParams = [];
            for (const param of this.queryParams) {
                const value = this.queryParamValues[param.name];

                if (value !== undefined && value !== null && value !== '') {
                    if (param.name === 'filters' || param.type === 'json') {
                        try {
                            const parsedValue = typeof value === 'string' ?
                                (value.trim() ? JSON.parse(value) : {}) :
                                value;

                            if (Object.keys(parsedValue).length > 0) {
                                const jsonStr = JSON.stringify(parsedValue);
                                queryParams.push(`${param.name}=${encodeURIComponent(jsonStr)}`);
                            }
                        } catch (e) {
                            console.warn(`Invalid JSON for param ${param.name}:`, e);
                        }
                    } else {
                        queryParams.push(`${param.name}=${encodeURIComponent(value)}`);
                    }
                }
            }

            let url = `${this.apiBaseUrl}/${path}`;
            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            this.fullRequestUrl = url;
        },

        checkScreenSize() {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 1024;

            if (!wasMobile && this.isMobile) {
                this.sidebarOpen = false;
            } else if (wasMobile && !this.isMobile) {
                const savedState = localStorage.getItem('sidebarOpen');

                if (savedState === null)
                    this.sidebarOpen = true;
            }

            if (this.isMobile)
                this.apiSidebarOpen = false;
            else
                this.apiSidebarOpen = true;
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },

        toggleApiSidebar() {
            this.apiSidebarOpen = !this.apiSidebarOpen;
        },

        toggleAuthModal(fn) {
            this.showAuthModal = !this.showAuthModal;
            this.authModalCallback = fn;
        },

        saveToken() {
            if (this.bearerToken) {
                this.authData.token = this.bearerToken;
                this.saveAuthDataToStorage();
                this.showAuthModal = false;
                this.bearerToken = '';

                if (this.selectedTab === 8 && this.dataTable) {
                    setTimeout(() => {
                        this.dataTable.refreshData();
                    }, 300);
                }
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

                    if (this.selectedTab === 8 && this.dataTable) {
                        setTimeout(() => {
                            this.dataTable.refreshData();
                        }, 300);
                    }

                    if (this.authModalCallback) {
                        this.authModalCallback();
                    }
                } else {
                    alert('Authentication failed. Please check your credentials.');
                }
            } catch (error) {
                console.log(error);
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
                                required: !!prop.required,
                                link: prop.link || false
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
                        required: !field.nullable && !field.defaultValue,
                        link: field.link || false
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

                    await fetch('/sandbox/restart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

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
                } if (!obj[key] && obj[key] !== 0 && obj[key] !== false) {
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
                        schema[key].sync = false;
                        updatedContracts.push(key);
                        storedHashes[key] = newHash;
                    }
                    else if (!storedHashes[key]) {
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
                    return true;
                }
            } catch (e) {
                console.error(e);
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
                            contract.sync = false;
                            hasChanges = true;
                        }
                        else if (!contractHashes[key]) {
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
        },

        confirmDeleteContract() {
            this.confirmContractName = '';
            this.modalDeleteContract = true;
        },

        async deleteContract() {
            if (this.confirmContractName !== this.selectedContract.contractName) {
                return;
            }

            try {
                this.isDeleting = true;

                const contractKey = Object.keys(this.schema).find(
                    key => this.schema[key].contractName === this.selectedContract.contractName
                );

                if (!contractKey) {
                    throw new Error('Contract not found');
                }

                const response = await fetch(`/sandbox/${encodeURIComponent(this.selectedContract.contractName)}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).then();

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete contract');
                }

                delete this.schema[contractKey];

                this.schemaToLocalStorege();

                const remainingContracts = Object.keys(this.schema);
                if (remainingContracts.length > 0) {
                    this.selectContract(remainingContracts[0]);
                } else {
                    this.selectedContract = null;
                }

                this.modalDeleteContract = false;
            } catch (error) {
                console.error('Error deleting contract:', error);
                alert(`Failed to delete contract: ${error.message}`);
            } finally {
                this.isDeleting = false;
            }
        },

        toggleTabDropdown() {
            this.tabDropdownOpen = !this.tabDropdownOpen;
            if (this.tabDropdownOpen) {
                this.functionalTabDropdownOpen = false;
            }
        },

        toggleFunctionalTabDropdown() {
            this.functionalTabDropdownOpen = !this.functionalTabDropdownOpen;
            if (this.functionalTabDropdownOpen) {
                this.tabDropdownOpen = false;
            }
        },

        selectTabAndCloseDropdown(key) {
            this.selectTab(key);
            this.functionalTabDropdownOpen = false;
        },

        selectContractMasterTabAndCloseDropdown(key) {
            this.selectContractMasterTab(key);
            this.functionalTabDropdownOpen = false;
        },

        setContractTab(tab) {
            this.contractTab = tab;
        },

        setContractTabMaster(tab) {
            this.selectedMasterTab = tab;
            localStorage.setItem('selectedMasterTab', tab);
        },

        checkTabOverflow() {
            const tabsContainer = document.getElementById('full-tabs');
            const overflowDropdown = document.getElementById('overflow-dropdown');

            if (tabsContainer && overflowDropdown && window.innerWidth >= 768) {
                const tabsWidth = tabsContainer.scrollWidth;
                const containerWidth = tabsContainer.clientWidth;

                if (tabsWidth > containerWidth) {
                    overflowDropdown.style.display = 'flex';
                } else {
                    overflowDropdown.style.display = 'none';
                }
            }
        },

        handleClickOutside(event) {
            if (this.tabDropdownOpen) {
                const dropdown = document.getElementById('tab-dropdown-container');
                const button = document.getElementById('tab-menu-button');
                const overflowDropdown = document.getElementById('overflow-dropdown');

                if (dropdown && !dropdown.contains(event.target) &&
                    button && !button.contains(event.target) &&
                    overflowDropdown && !overflowDropdown.contains(event.target)) {
                    this.tabDropdownOpen = false;
                }
            }
        },

        addValidation(field) {
            if (!field.validations) {
                field.validations = [];
            }

            field.validations.push({
                type: 'IsString',
                message: 'Invalid value',
                value: null
            });
        },

        removeValidation(field, index) {
            if (field.validations && field.validations.length > index) {
                field.validations.splice(index, 1);
            }
        },

        needsSimpleValue(validationType) {
            const typesWithSimpleValues = [
                'Min', 'Max', 'MinLength', 'MaxLength',
                'Matches', 'Equals', 'NotEquals',
                'ArrayMinSize', 'ArrayMaxSize', 'ArrayContains', 'ArrayNotContains',
                'IsDivisibleBy', 'MinDate', 'MaxDate'
            ];
            return typesWithSimpleValues.includes(validationType);
        },

        getInputTypeForValidation(validationType) {
            const numberTypes = ['Min', 'Max', 'MinLength', 'MaxLength', 'ArrayMinSize', 'ArrayMaxSize', 'IsDivisibleBy'];
            const dateTypes = ['MinDate', 'MaxDate'];

            if (numberTypes.includes(validationType)) {
                return 'number';
            } else if (dateTypes.includes(validationType)) {
                return 'date';
            }

            return 'text';
        },

        getPlaceholderForValidation(validationType) {
            const placeholders = {
                'Min': 'Minimum value',
                'Max': 'Maximum value',
                'MinLength': 'Minimum length',
                'MaxLength': 'Maximum length',
                'Matches': 'Regular expression pattern',
                'Equals': 'Value to equal',
                'NotEquals': 'Value to not equal',
                'ArrayMinSize': 'Minimum array size',
                'ArrayMaxSize': 'Maximum array size',
                'ArrayContains': 'Value array must contain',
                'ArrayNotContains': 'Value array must not contain',
                'IsDivisibleBy': 'Number to be divisible by',
                'MinDate': 'Minimum date',
                'MaxDate': 'Maximum date'
            };

            return placeholders[validationType] || 'Value';
        },

        getOrCreateOptions(validation) {
            if (!validation.options) {
                validation.options = {};
            }

            if (validation.type === 'Length' && !('min' in validation.options)) {
                validation.options.min = null;
                validation.options.max = null;
            } else if (validation.type === 'IsStrongPassword') {
                if (!('minLength' in validation.options)) validation.options.minLength = 8;
                if (!('minLowercase' in validation.options)) validation.options.minLowercase = true;
                if (!('minUppercase' in validation.options)) validation.options.minUppercase = true;
                if (!('minNumbers' in validation.options)) validation.options.minNumbers = true;
                if (!('minSymbols' in validation.options)) validation.options.minSymbols = true;
            }

            return validation.options;
        },

        addRelationship(field) {
            if (!field.link) {
                field.link = [];
            }

            field.link.push({
                createRelationship: false,
                entityName: '',
                field: '_id',
                array: false,
                entityNullable: false,
                contract: ''
            });

            if (!field.protoType) field.protoType = 'string';
            if (!field.nullable) field.nullable = true;
            if (!field.objectType) field.objectType = 'object';
        },

        removeRelationship(field, index) {
            if (field.link && field.link.length > index) {
                field.link.splice(index, 1);
            }
        },

        handleDataTableAuthError() {
            this.showAuthModal = true;
            this.pendingDataTableRefresh = true;
        },

        isLinkField(param) {
            return (
                param.type === 'string' ||
                param.protoType === 'string'
            ) && (
                param.name?.endsWith('Id') ||
                param.name?.endsWith('_id') ||
                param.propertyKey?.endsWith('Id') ||
                param.relation ||
                param.link
            );
        },

        getEntityNameFromField(param) {
            if (param.link && Array.isArray(param.link) && param.link.length > 0) {
                const linkInfo = param.link[0];
                return linkInfo.entityName || linkInfo.contract || '';
            }

            if (param.relation) return param.relation;

            let name = param.name || param.propertyKey || '';

            if (name.endsWith('Id')) {
                return name.substring(0, name.length - 2);
            }

            if (name.endsWith('_id')) {
                return name.substring(0, name.length - 3);
            }

            return name;
        },

        getContractNameFromEntityName(param) {
            if (param.link && Array.isArray(param.link) && param.link.length > 0) {
                const linkInfo = param.link[0];
                return linkInfo?.contract || '';
            }

            return null;
        },

        async fetchLinkedEntityRecords(entityName, contractName) {
            if (this.linkedEntities[entityName]) {
                return this.linkedEntities[entityName];
            }

            this.loadingLinks[entityName] = true;

            try {
                let targetContract = null;
                let apiPath = '';

                for (const key in this.schema) {
                    const contract = this.schema[key];

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

                if (targetContract) {
                    apiPath = targetContract.controllerCustomPath ||
                             (targetContract.controllerName ? targetContract.controllerName.toLowerCase() : '');
                } else {
                    console.warn(`Contract for entity "${entityName}" not found, using entity name as fallback`);
                    apiPath = entityName.toLowerCase();
                }

                apiPath = apiPath.replace(/^\/+/, '').replace(/\/+/g, '/');

                const baseUrl = window.location.origin;
                const apiUrl = `${baseUrl}/${apiPath}`;

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.authData?.token ? {'Authorization': `Bearer ${this.authData.token}`} : {})
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch linked entity ${entityName}: ${response.statusText}`);
                }

                const data = await response.json();

                const records = data.result?.data ||
                              data.result?.items ||
                              data.result ||
                              data.records ||
                              data.items ||
                              data;

                this.linkedEntities[entityName] = Array.isArray(records) ? records : [];
                return this.linkedEntities[entityName];
            } catch (error) {
                console.error(`Error loading linked entity ${entityName}:`, error);
                this.linkedEntities[entityName] = [];
                return [];
            } finally {
                this.loadingLinks[entityName] = false;
            }
        },

        getDisplayField(record) {
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
        },

        initLinkedEntities() {
            if (!this.bodyParams) return;

            this.bodyParams.forEach(param => {
                if (this.isLinkField(param)) {
                    const entityName = this.getEntityNameFromField(param);
                    const contractName = this.getContractNameFromEntityName(param);
                    this.fetchLinkedEntityRecords(entityName, contractName);
                }
            });
        },
    }
}).mount('#app')
