(function(global) {
    try {
        class Telemetry {
            constructor(serverMetrics) {
                this.metrics = {};
            }

            start(label) {
                label = `Client: ${label}`;

                if (!this.metrics[label]) 
                    this.metrics[label] = { start: 0, end: 0, duration: 0 };
                
                this.metrics[label].start = performance.now();
            }

            end(label) {
                label = `Client: ${label}`;

                if (this.metrics[label]) {
                    this.metrics[label].end = performance.now();
                    this.metrics[label].duration = this.metrics[label].end - this.metrics[label].start;
                }
            }

            log() {
                let serverMetrics = global.cmmvTelemetry;

                if(serverMetrics?.length > 0){
                    let frontend = this.metrics;
                    this.metrics = {};

                    serverMetrics.map((item) => this.metrics[`Server: ${item.label}`] = {
                        start: item.startTime,
                        end: item.endTime,
                        duration: item.endTime - item.startTime
                    });

                    this.metrics = { ...this.metrics, ...frontend };
                }

                let totalDuration = 0;
                const summary = Object.keys(this.metrics).map(key => {
                    const duration = this.metrics[key].duration;
                    totalDuration += duration;
                    return {
                        Process: key,
                        Duration: `${duration.toFixed(2)} ms`,
                    };
                });
                        
                if(process.env.NODE_ENV === "dev")
                    console.table(summary);
            }            
        }

        let cmmvMiddleware = {
            app: null,
            socket: null,
            contractIndex: {},
            contracts: {},
            context: {},
            contextApp: null,
            loaded: false,
            binds: {},
            telemetry: new Telemetry(),
            reconnectInterval: 10000,
            isAuth: false,
            theme: "default",
            styleSettings: {},
            components: {},
            vuePlugins: [],
            methods: {},

            initialize(context, styles, components, vuePlugins, methods) {
                this.telemetry.start("Initialize Frontend");
                this.methods = methods;

                try {
                    if (context.config && context.config.rpc && context.config.rpc.enabled && !window.Vue) {
                        this.telemetry.start("WebSocket Initialization");
                        this.connectWebSocket();
                        this.telemetry.end("WebSocket Initialization");
                    }
                } catch (e) {
                    console.error(e);
                }

                if (typeof context === "object") 
                    this.context = Object.assign(this.context, context);

                let stylesObj = {};
                const themeSufix = ((this.theme !== "default") ? "." + this.theme : "");
                const protectedNames = ["get", "load", "refresh", "theme", "switch"];
                
                if (typeof styles === "object") {
                    this.styleSettings = Object.assign(this.styleSettings, styles);

                    for(const index in this.styleSettings){
                        for(const style in this.styleSettings[index]){
                            if(style.indexOf(themeSufix) !== -1){
                                const name = style.replace(themeSufix, "");

                                if(!stylesObj[index])
                                    stylesObj[index] = {};

                                if(!protectedNames.includes(name))
                                    stylesObj[index][name] = this.styleSettings[index][style];
                            }
                        }
                    }
                }
                    
                if(components){
                    for(let componentName in components){
                        this.components[componentName] = {};

                        for(let field in components[componentName]){
                            if(
                                components[componentName][field] && 
                                typeof components[componentName][field] == "string" &&
                                components[componentName][field].startsWith("function")
                            ) {
                                this.components[componentName][field] = 
                                    new Function(`return (${components[componentName][field]})`)();
                            }
                            else {
                                this.components[componentName][field] = 
                                    components[componentName][field];
                            }
                        }

                        this.components[componentName].$parent = this;
                        this.components[componentName].$style = this.styles;
                        this.components[componentName].$style.load();
                    }
                }

                if(vuePlugins && Array.isArray(vuePlugins)) 
                    this.vuePlugins = vuePlugins;
                                
                document.addEventListener("DOMContentLoaded", () => {
                    this.processExpressions();
                    this.telemetry.log();
                });

                this.telemetry.end("Initialize Frontend");
            },

            connectWebSocket() {
                const socketUrl = window.location.href.replace("https", "wss").replace("http", "ws");
                this.socket = new WebSocket(socketUrl);
                this.socket.binaryType = "arraybuffer";

                this.socket.addEventListener("message", this.parseMessage.bind(this));
                this.socket.addEventListener("open", () => {
                    this.telemetry.end("WebSocket Initialization");
                });

                this.socket.addEventListener("close", () => {
                    console.warn("WebSocket disconnected. Attempting to reconnect in 10 seconds...");
                    setTimeout(() => {
                        this.connectWebSocket(); 
                    }, this.reconnectInterval);
                });

                this.socket.addEventListener("error", (error) => {
                    console.error("WebSocket error:", error);
                });
            },

            addContracts(jsonContracts) {
                this.telemetry.start("Load Contracts");

                try {
                    this.contractIndex = jsonContracts.index;

                    for (let contractName in jsonContracts.contracts) {
                        if (jsonContracts.contracts.hasOwnProperty(contractName)) {
                            let contract = protobuf.Root.fromJSON(jsonContracts.contracts[contractName]);
                            this.contracts[contractName] = contract;
                        }
                    }

                    this.generateRPCBindings();
                } catch (e) {
                    console.error("Error loading contracts:", e);
                }

                this.telemetry.end("Load Contracts");
            },

            getContract(contractName) {
                return this.contracts[contractName];
            },

            parseMessage(event) {
                this.telemetry.start("Parse Message");

                try {
                    const buffer = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
                    const message = this.contracts["ws"].lookupType("WsCall").decode(buffer);

                    const contractName = Object
                    .keys(this.contractIndex)
                    .find(name => this.contractIndex[name].index === message.contract);
                    
                    const typeName = Object
                    .keys(this.contractIndex[contractName].types)
                    .find(key => this.contractIndex[contractName].types[key] === message.message);

                    if (contractName && typeName) {
                        const contract = this.getContract(contractName);
                        const MessageType = contract.lookupType(typeName);
                        const decodedMessage = MessageType.decode(message.data);

                        if (this.binds[contractName] && this.binds[contractName][typeName]) {
                            this.binds[contractName][typeName].forEach(callback => callback.apply(
                                this.contextApp, [decodedMessage, event.socket]
                            ));
                        }
                    } else {
                        console.error("Unknown contract or message type:", message.contract, message.message);
                    }
                } catch (error) {
                    console.error(error);
                }
                
                this.telemetry.end("Parse Message");
            },

            pack(contractName, messageName, data) {
                try{
                    if(this.contracts[contractName] && this.contractIndex[contractName]) {
                        const contractIndex = this.contractIndex[contractName];
                        const typeIndex = contractIndex?.types[messageName];
                        const contract = this.contracts[contractName];
                        const message = contract?.lookupType(messageName);
                        const dataBuffer = (message && data) ? message.encode(data).finish() : null;
                        const wsCall = this.contracts["ws"];
                        const wsMessage = wsCall?.lookupType("WsCall");
            
                        const buffer = wsMessage?.encode({
                            contract: contractIndex?.index,
                            message: typeIndex,
                            data: (dataBuffer && dataBuffer instanceof Uint8Array) ? dataBuffer : new Uint8Array()
                        }).finish();
            
                        return (buffer) ? new Uint8Array(buffer) : null;
                    } else {
                        console.error(`Not found in contract list ${contractName}.${messageName}`);
                        return null;
                    }
                }
                catch(e){
                    console.error(e);
                }
            },

            generateRPCBindings() {            
                Object.keys(cmmv.contracts).forEach((contractName) => {
                    const contract = cmmv.contracts[contractName];
            
                    if (contract.nested) {
                        Object.keys(contract.nested).forEach((nestedName) => {
                            const nestedItem = contract.nested[nestedName];
                            
                            if (nestedItem.nested) {
                                Object.keys(nestedItem.nested).forEach((methodName) => {
                                    if(methodName.indexOf("Request") > -1){
                                        cmmv[methodName] = (data) => {
                                            if(methodName.startsWith("Add"))
                                                this.rpc.add(contractName, methodName, data);
                                            else if(methodName.startsWith("Update"))
                                                this.rpc.update(contractName, methodName, data);
                                            else if(methodName.startsWith("Delete"))
                                                this.rpc.delete(contractName, methodName, { id: data });
                                        }   
                                    }
                                    else if(methodName.indexOf("Response")){
                                        if(this[methodName]  && typeof this[methodName] === "function")
                                            this.rpc.on(contractName, methodName, this[methodName]);                                        
                                    }
                                });
                            }
                        });
                    }
                });
            },

            send(buffer) {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(buffer);
                } else {
                    console.warn("WebSocket is not open. Unable to send message.");
                }
            },

            async processExpressions() {
                this.telemetry.start("Process Expressions");
     
                this.telemetry.start("CreateApp");

                this.styles.load();

                const styles = {
                    ...this.styles.refresh(),
                    styleSettings: this.styleSettings
                };

                if(window.Vue){
                    const { createApp } = (Vue) ? Vue : await import("/node_modules/vue/dist/vue.esm-bundler.js");
                    const data = Object.assign({}, this.context);

                    let methods = {};
                    let appConfig = {};

                    if (typeof global.cmmvSetup.__methods === "object") {
                        for (let key in global.cmmvSetup.__methods)
                            methods[key] = new Function(`return (${global.cmmvSetup.__methods[key]})`)()
                    }

                    try {
                        if(this.context.config.rpc.enabled){
                            const { default: CMMVMixin } = await import("/assets/rpc-mixins.js");
                        
                            appConfig = {
                                data() {
                                    return { 
                                        ...data,
                                        ...CMMVMixin.data?.(),
                                    };
                                },
                                components: this.components,
                                styles: styles,
                                $style: styles,
                                mounted() {
                                    if (typeof this.mounted === "function") this.mounted();
                                    if (typeof CMMVMixin.mounted === "function") CMMVMixin.mounted.call(this);
                                },
                                created() {
                                    if (typeof this.created === "function") this.created();
                                    if (typeof CMMVMixin.created === "function") CMMVMixin.created.call(this);
                                },
                                methods: {
                                    ...methods,
                                    ...CMMVMixin.methods,
                                },
                                ...this.context,
                            };
                        }
                        else{
                            appConfig = {
                                data() { return {  ...data }; },
                                components: this.components,
                                styles: styles,
                                $style: styles,
                                mounted: this.mounted,
                                created: this.created,
                                methods: { ...methods },
                                ...this.context,
                            };
                        }
                        
                    }
                    catch {
                        appConfig = {
                            data() { return {  ...data }; },
                            components: this.components,
                            styles: styles,
                            $style: styles,
                            mounted() {
                                if (typeof this.mounted === "function") this.mounted();
                            },
                            created() {
                                if (typeof this.created === "function") this.created();
                            },
                            methods: { ...methods },
                            ...this.context,
                        };
                    }
                    
                    const app = createApp(appConfig);

                    if(this.vuePlugins.length > 0){
                        for(let key in this.vuePlugins) {
                            const { plugin, config } = this.vuePlugins[key];
                            const pluginInstance = await import(plugin.startsWith("@") ? `/node_modules/${plugin}` : plugin);

                            if(config){
                                const configInstance = await import(config);
                                app.use(pluginInstance.default, configInstance.default);
                            }
                            else {
                                app.use(pluginInstance);
                            }
                        }
                    }

                    app.mount("#app")
                }
                else{
                    this.contextApp = this.reactive({
                        $template: "#app",  
                        components: this.components,                  
                        ...this,
                        rpc: this.rpc,
                        $rpc: this.rpc,
                        styles: styles,
                        $style: styles,
                        ...this.context,
                        loaded: true,
                        mounted: this.mounted,
                        created: this.created
                    });

                    this.contextApp.styles.load();
    
                    const app = this.createApp(this.contextApp);
                    this.telemetry.end("CreateApp");
    
                    if (typeof this.contextApp?.created === "function") {
                        this.telemetry.start("Created Hook");
                        this.contextApp?.created();
                        this.telemetry.end("Created Hook");
                    }
    
                    this.telemetry.start("Mount App");
                    this.app = app.mount("#app");
                    this.telemetry.end("Mount App");
                }

                if (typeof this.contextApp?.mounted === "function") {
                    this.telemetry.start("Mounted Hook");
                    this.contextApp?.mounted();
                    this.telemetry.end("Mounted Hook");
                }

                this.telemetry.end("Process Expressions");
            },

            rpc: {
                get(contract, messageType) {
                    const context = this?.pack ? this : cmmv;
                    let buffer = context.pack.call(context, contract, messageType);
                    context.send(buffer);
                },
                add(contract, messageType, data) {
                    const context = this?.pack ? this : cmmv;
                    let buffer = context.pack.call(context, contract, messageType, { item: data });
                    context.send(buffer);
                },
                update(contract, messageType, data) {
                    const context = this?.pack ? this : cmmv;
                    let buffer = context.pack.call(context, contract, messageType, { id: data._id || data.id, item: data });
                    context.send(buffer);
                },
                delete(contract, messageType, data) {
                    const context = this?.pack ? this : cmmv;
                    let buffer = context.pack.call(context, contract, messageType, { id: data._id || data.id });
                    context.send(buffer);
                },
                on(contract, messageType, cb) {
                    const context = this?.binds ? this : cmmv;
                    if (!context.binds[contract]) context.binds[contract] = {};
                    if (!context.binds[contract][messageType]) context.binds[contract][messageType] = [];
                    context.binds[contract][messageType].push(cb);
                }
            },

            styles: {
                theme: "default",

                styleSettings: null,

                load(){
                    const cachedTheme = localStorage.getItem("theme") || "default";
                    this.theme = cachedTheme;
                    this.refresh();
                },

                refresh(){
                    const themeSufix = ((this.theme !== "default") ? "." + this.theme : "");
                    const protectedNames = ["get", "load", "refresh", "theme", "switch"];
                    const settings = this.styleSettings || cmmv.styleSettings;

                    for(const index in settings){
                        for(const style in settings[index]){
                            if(style.indexOf(themeSufix) !== -1 || this.theme === "default"){
                                const name = style.replace(themeSufix, "");

                                if(!this[index])
                                    this[index] = {};

                                if(!protectedNames.includes(name))
                                    this[index][name] = settings[index][style];
                            }
                        }
                    }

                    return this;
                },

                get(name) {
                    const index = name.split(".")[0];
                    const search = name.replace(index + ".", "") + ((this.theme !== "default") ? "." + this.theme : "");
                    return (cmmv.styleSettings[index] && cmmv.styleSettings[index][search]) ? cmmv.styleSettings[index][search] : "";
                },

                switch(newTheme){
                    localStorage.setItem("theme", newTheme);
                    this.theme = newTheme;
                    this.refresh();
                }
            }
        };

        if (global.cmmvSetup) { 
            if(!global.cmmv && window.Vue)
                global.cmmv = window.Vue;
            if(!global.cmmv)
                global.cmmv = {};
            
            let methods = {};

            if (typeof global.cmmvSetup.__methods === "object") {
                for (let key in global.cmmvSetup.__methods)
                    methods[key] = new Function(`return (${global.cmmvSetup.__methods[key]})`)()
            }

            let mounted = (global.cmmvSetup.__mounted) ? new Function(`return (${global.cmmvSetup.__mounted})`)() : null;

            global.cmmv = Object.assign({ ...methods, mounted }, cmmv, global.cmmvSetup, cmmvMiddleware);
            global.cmmv.initialize(
                global.cmmvSetup.__data || {}, 
                global.cmmvSetup.__styles || {}, 
                global.cmmvSetup.__components || {},
                global.cmmvSetup.__vuePlugins || {},
                global.cmmvSetup.methods || {}
            );
        } else {
            global.cmmv = Object.assign({}, cmmvMiddleware);
            global.cmmv.initialize({}, {}, {}, {});
        }
    } catch (e) {
        console.error(e);
    }
})(typeof window !== "undefined" ? window : global);
