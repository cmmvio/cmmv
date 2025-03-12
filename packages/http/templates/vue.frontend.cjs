export default {
    mounted(){
        //console.log("Load CMMV Mixins");
        this.addContracts(//%CONTRATCTS%);
        this.connectWebSocket();
    },

    data(){
        return {
            socket: null,
            contractIndex: 0,
            contracts: {},
            binds: {},
        }
    },

    methods: {
        connectWebSocket() {
            const socketUrl = window.location.href.replace("https", "wss").replace("http", "ws");
            this.socket = new WebSocket(socketUrl);
            this.socket.binaryType = "arraybuffer";

            this.socket.addEventListener("message", this.parseMessage);
            this.socket.addEventListener("open", () => {
               //console.log("WebSocket Initialization");
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
            try {
                this.contractIndex = jsonContracts.index;

                for (let contractName in jsonContracts.contracts) {
                    if (jsonContracts.contracts.hasOwnProperty(contractName)) {
                        let contract = protobuf.Root.fromJSON(jsonContracts.contracts[contractName]);
                        this.contracts[contractName] = contract;
                    }
                }
            } catch (e) {
                console.error("Error loading contracts:", e);
            }
        },

        getContract(contractName) {
            return this.contracts[contractName];
        },

        parseMessage(event) {
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

                    if(typeof this[typeName] === "function")
                        this[typeName].call(this, decodedMessage, event.socket)
                } else {
                    console.error("Unknown contract or message type:", message.contract, message.message);
                }
            } catch (error) {
                console.error(error);
            }
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

        send(buffer) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(buffer);
            } else {
                console.warn("WebSocket is not open. Unable to send message.");
            }
        },
//%RPCFUNCTIONS%
    }
}