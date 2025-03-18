const { createApp } = Vue;
let schemaEditor;

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
                { label: "API", active: false }
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
            schemaEditor: null,
            newContractData: {},
            hiddenModuleContracts: false
        }
    },

    mounted() {
        this.connectWebSocket();
        this.getSchema();

        const selectedTab = localStorage.getItem('selectedTab');
        const hiddenModuleContracts = localStorage.getItem('hiddenModuleContracts');

        this.selectedTab = Number(selectedTab) ?? 0;
        this.hiddenModuleContracts = (hiddenModuleContracts === 'true');
    },

    watch: {
        schema: {
            handler(newSchema) {
                localStorage.setItem("schema", JSON.stringify(newSchema));
            },
            deep: true
        },
        hiddenModuleContracts: {
            handler(newState) {
                localStorage.setItem("hiddenModuleContracts", newState);
            },
            deep: true
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
            const selectedTab = localStorage.getItem('selectedTab');
            this.selectedTab = Number(selectedTab) ?? 0;
            setTimeout(() => this.selectTab(this.selectedTab), 100);
        },

        async refreshSchema(){
            const req = await fetch('/sandbox/schema').then();
            this.schema = (await req.json()).result.contracts;
            this.schemaToLocalStorege();
        },

        schemaToLocalStorege(){
            localStorage.setItem("schema", JSON.stringify(this.schema));
        },

        selectTab(index){
            this.selectedTab = index;
            localStorage.setItem('selectedTab', index);
            this.updateSchemaEditor();
        },

        selectContract(key){
            this.selectedContract = this.schema[key];
            localStorage.setItem('selectedContract', key);
            this.opened = [];
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
                    protoPath: `${this.newContractData.controllerNam.toLowerCase()}.proto`,
                    protoPackage: `${this.newContractData.subPath.toLowerCase().replace('/').trim()}`,
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

        addField(){
            if(!this.selectedContract.options.moduleContract){
                this.selectedContract.fields.push({
                    protoType: 'boolean',
                    propertyKey: "newfield"
                });
            }
        },

        removeField(key, fieldKey){
            if(!this.selectedContract.options.moduleContract){
                this.modalContent = {
                    title: `Do want to remove the field '${key}'?`,
                    content: `By performing this action you will permanently remove the field and this will have repercussions throughout the application.`,
                    metadata: { field: key },
                    cb: () => {
                        const fields = this.selectedContract.fields.filter((field) => field.propertyKey !== key);
                        this.selectedContract.fields = fields;
                        this.modalConfirm = false;
                    }
                }

                this.modalConfirm = true
            }
        },

        getEndpoint(contract){
            console.log(window.location)
            return `${window.location.protocol}//${window.location.host}/${contract.controllerCustomPath ? contract.controllerCustomPath.toLowerCase() :
                contract.controllerName.toLowerCase()
            }`
        },

        syncApplication(){

        }
    }
}).mount('#app')
