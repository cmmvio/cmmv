import { ref, reactive, onMounted } from "vue";
import protobuf from "protobufjs";

export function useCMMV() {
    const socket = ref(null);
    const contractIndex = ref(0);
    const contracts = reactive({});
    const binds = reactive({});

    const connectWebSocket = () => {
        const socketUrl = window.location.href.replace("https", "wss").replace("http", "ws");
        socket.value = new WebSocket(socketUrl);
        socket.value.binaryType = "arraybuffer";

        socket.value.addEventListener("message", parseMessage);
        socket.value.addEventListener("open", () => {
            //console.log("WebSocket Initialization");
        });

        socket.value.addEventListener("close", () => {
            console.warn("WebSocket disconnected. Attempting to reconnect in 10 seconds...");
            setTimeout(() => {
                connectWebSocket();
            }, 10000);
        });

        socket.value.addEventListener("error", (error) => {
            console.error("WebSocket error:", error);
        });
    };

    const addContracts = (jsonContracts) => {
        try {
            contractIndex.value = jsonContracts.index;

            for (let contractName in jsonContracts.contracts) {
                if (jsonContracts.contracts.hasOwnProperty(contractName)) {
                    let contract = protobuf.Root.fromJSON(jsonContracts.contracts[contractName]);
                    contracts[contractName] = contract;
                }
            }
        } catch (e) {
            console.error("Error loading contracts:", e);
        }
    };

    const getContract = (contractName) => {
        return contracts[contractName];
    };

    const parseMessage = (event) => {
        try {
            const buffer = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
            const message = contracts["ws"].lookupType("WsCall").decode(buffer);

            const contractName = Object
                .keys(contractIndex.value)
                .find(name => contractIndex.value[name].index === message.contract);

            const typeName = Object
                .keys(contractIndex.value[contractName].types)
                .find(key => contractIndex.value[contractName].types[key] === message.message);

            if (contractName && typeName) {
                const contract = getContract(contractName);
                const MessageType = contract.lookupType(typeName);
                const decodedMessage = MessageType.decode(message.data);

                if (binds[contractName] && binds[contractName][typeName]) {
                    binds[contractName][typeName].forEach(callback => callback.apply(
                        null, [decodedMessage, event.socket]
                    ));
                }

                if (typeof this?.[typeName] === "function")
                    this[typeName](decodedMessage, event.socket);
            } else {
                console.error("Unknown contract or message type:", message.contract, message.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const pack = (contractName, messageName, data) => {
        try {
            if (contracts[contractName] && contractIndex.value[contractName]) {
                const contractIndexData = contractIndex.value[contractName];
                const typeIndex = contractIndexData?.types[messageName];
                const contract = contracts[contractName];
                const message = contract?.lookupType(messageName);
                const dataBuffer = (message && data) ? message.encode(data).finish() : null;
                const wsCall = contracts["ws"];
                const wsMessage = wsCall?.lookupType("WsCall");

                const buffer = wsMessage?.encode({
                    contract: contractIndexData?.index,
                    message: typeIndex,
                    data: (dataBuffer && dataBuffer instanceof Uint8Array) ? dataBuffer : new Uint8Array()
                }).finish();

                return (buffer) ? new Uint8Array(buffer) : null;
            } else {
                console.error(`Not found in contract list ${contractName}.${messageName}`);
                return null;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const send = (buffer) => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            socket.value.send(buffer);
        } else {
            console.warn("WebSocket is not open. Unable to send message.");
        }
    };

    onMounted(() => {
        //console.log("Load CMMV Mixins");
        addContracts(//%CONTRATCTS%);
        connectWebSocket();
    });

    const methods = {
        //%RPCFUNCTIONS%
    }

    return {
        socket,
        contractIndex,
        contracts,
        binds,
        connectWebSocket,
        addContracts,
        getContract,
        parseMessage,
        pack,
        send,
        ...methods
    };
}
