const useGraphQLExplorer = () => {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // Referência para o editor Monaco
    let queryEditor = null;
    let editorInitTimer = null;
    let initAttempts = 0;

    // Configuração
    const endpoint = ref('http://localhost:4000/graphql');

    // Estado do schema
    const schema = reactive({
        loading: false,
        error: null,
        data: null,
        queryTypes: [],
        mutationTypes: [],
        subscriptionTypes: [],
        allTypes: []
    });

    // UI State
    const ui = reactive({
        docExplorerOpen: true,
        selectedType: null,
        selectedField: null,
        selectedOperation: 'query', // 'query', 'mutation', 'subscription'
        schemaFilter: '',
        activeTab: 'query', // 'query', 'variables', 'headers', 'docs'
        responseTab: 'formatted', // 'formatted', 'raw'
        cursorContext: null,
        contextFields: [],
        editorInitialized: false
    });

    // Editor
    const editor = reactive({
        query: `# Write your GraphQL query here
query {

}`,
        variables: '{}',
        headers: '{}',
        response: null,
        responseTime: null,
        responseStatus: null,
        loading: false,
        error: null
    });

    // Estado de seleção de campos
    const selection = reactive({
        fields: {},
        addedFields: new Set(),
        addedArguments: new Set(),
        nestedFields: {}, // Estrutura: { "parent.field": Set() }
        navigationPath: [], // Array de objetos {field, type}
        currentPath: '', // Caminho atual (ex: "userFind.data")
        rootOperation: null,
    });

    // Adicionar computed property para query com highlight
    const formattedQuery = computed(() => {
        if (!editor.query) return '';

        try {
            // Detecta se temos o highlight.js disponível
            if (window.hljs) {
                return hljs.highlight(editor.query, { language: 'graphql' }).value;
            }

            // Fallback para query sem formatação
            return editor.query;
        } catch (err) {
            console.error('Erro ao formatar query:', err);
            return editor.query;
        }
    });

    // ------------------------
    // Funções auxiliares
    // ------------------------

    // NOVA função para obter os headers com autenticação
    function getAuthHeaders(customHeaders = {}) {
        // Base headers
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        // Usar o mesmo sistema de autenticação que o sandbox-api
        try {
            // Obter dados de autenticação do localStorage
            const storedAuth = localStorage.getItem('apiExplorerAuth');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData && authData.token) {
                    // Adicionar token sem o prefixo Bearer
                    headers['Authorization'] = authData.token;
                }
            }
        } catch (e) {
            console.error('Erro ao processar token de autenticação:', e);
        }

        return headers;
    }

    // Função para obter o nome formatado de um tipo GraphQL
    function getTypeName(typeObj) {
        if (!typeObj) return "Unknown";

        function getFullTypeName(type, isNonNull = false) {
            if (!type) return "Unknown";

            if (type.kind === "NON_NULL") {
                return getFullTypeName(type.ofType, true);
            }

            if (type.kind === "LIST") {
                return `[${getFullTypeName(type.ofType)}]${isNonNull ? '!' : ''}`;
            }

            return `${type.name}${isNonNull ? '!' : ''}`;
        }

        return getFullTypeName(typeObj);
    }

    // Função para obter o tipo aninhado final
    function getNestedType(typeObj) {
        if (!typeObj) return null;

        let finalType = typeObj;

        while (finalType.ofType) {
            finalType = finalType.ofType;
        }

        // Encontrar o tipo completo no schema
        return schema.allTypes.find(t => t.name === finalType.name);
    }

    // NOVA FUNÇÃO: Verifica se um campo é um objeto (tipo complexo)
    function isObjectField(field) {
        if (!field) return false;

        const nestedType = getNestedType(field.type);
        return nestedType &&
               nestedType.kind !== 'SCALAR' &&
               nestedType.kind !== 'ENUM' &&
               nestedType.fields &&
               nestedType.fields.length > 0;
    }

    // ------------------------
    // Computed properties
    // ------------------------

    // Filtra os tipos com base na pesquisa
    const filteredTypes = computed(() => {
        if (!schema.allTypes || schema.allTypes.length === 0) return [];

        const filter = ui.schemaFilter.toLowerCase();
        if (!filter) {
            return schema.allTypes.filter(t => !t.name.startsWith('__'));
        }

        return schema.allTypes.filter(t =>
            !t.name.startsWith('__') &&
            (t.name.toLowerCase().includes(filter) ||
             (t.description && t.description.toLowerCase().includes(filter)))
        );
    });

    // Determina o tipo de operação atual
    const rootType = computed(() => {
        switch (ui.selectedOperation) {
            case 'query': return schema.data?.queryType;
            case 'mutation': return schema.data?.mutationType;
            case 'subscription': return schema.data?.subscriptionType;
            default: return schema.data?.queryType;
        }
    });

    // Formata a resposta para exibição
    const formattedResponse = computed(() => {
        if (!editor.response) return '';

        try {
            // Detecta se temos o highlight.js disponível
            if (window.hljs) {
                const formatted = JSON.stringify(editor.response, null, 2);
                return hljs.highlight(formatted, { language: 'json' }).value;
            }

            // Fallback para formatação simples
            return JSON.stringify(editor.response, null, 2);
        } catch (err) {
            return typeof editor.response === 'string'
                ? editor.response
                : JSON.stringify(editor.response);
        }
    });

    // Modificar selectField para lidar com objetos
    function selectField(field) {
        ui.selectedField = field;
        ui.selectedType = getNestedType(field.type);

        if (isObjectField(field)) {
            let newPath = field.name;
            if (selection.currentPath) {
                newPath = `${selection.currentPath}.${field.name}`;
            }

            // Verificar se este campo já foi selecionado antes
            if (!selection.navigationPath.some(p => p.path === newPath)) {
                selection.navigationPath.push({
                    field: field.name,
                    type: ui.selectedType,
                    path: newPath
                });
            }

            selection.currentPath = newPath;

            if (!selection.nestedFields[selection.currentPath]) {
                selection.nestedFields[selection.currentPath] = new Set();
            }
        }

        console.log('Navigation path:', selection.navigationPath);
        console.log('Current path:', selection.currentPath);

        // Reconstruir a query depois de selecionar o campo
        rebuildFullQuery();
    }

    // Nova função para navegar de volta a um nível anterior
    function navigateBack(index) {
        console.log("Navegando de volta para o índice:", index);
        const targetIndex = index !== undefined ? index : selection.navigationPath.length - 2;

        if (targetIndex >= -1 && targetIndex < selection.navigationPath.length) {
            if (targetIndex === -1) {
                selection.navigationPath = [];
                selection.currentPath = '';
                ui.selectedField = selection.rootOperation;
                ui.selectedType = selection.rootOperation ? getNestedType(selection.rootOperation.type) : null;
                return;
            }

            selection.navigationPath = selection.navigationPath.slice(0, targetIndex + 1);

            const lastItem = selection.navigationPath[targetIndex];
            selection.currentPath = lastItem.path;

            if (targetIndex === 0) {
                ui.selectedField = selection.rootOperation;
                ui.selectedType = getNestedType(selection.rootOperation.type);
            } else {
                const prevItem = selection.navigationPath[targetIndex - 1];
                const prevType = prevItem.type;

                if (prevType && prevType.fields) {
                    const fieldName = lastItem.field;
                    const field = prevType.fields.find(f => f.name === fieldName);
                    if (field) {
                        ui.selectedField = field;
                        ui.selectedType = lastItem.type;
                    }
                }
            }
        }

        // Importante: atualizar a query após a navegação
        rebuildFullQuery();
    }

    // Nova função: Verifica se um campo está no caminho atual
    function isFieldInCurrentPath(fieldName) {
        if (!selection.currentPath) {
            return selection.addedFields.has(fieldName);
        }

        return selection.nestedFields[selection.currentPath] &&
               selection.nestedFields[selection.currentPath].has(fieldName);
    }

    // Substituir a função isFieldSelected
    function isFieldSelected(fieldName) {
        return isFieldInCurrentPath(fieldName);
    }

    // NOVA função: Verifica se um argumento está selecionado na query
    function isArgumentSelected(argName) {
        return selection.addedArguments.has(argName);
    }

    // ADICIONAR a função toggleArgument que está faltando
    function toggleArgument(argName) {
        if (isArgumentSelected(argName)) {
            removeArgumentFromQuery(argName);
        } else {
            addArgumentToQuery(argName);
        }
    }

    // Modificar toggleField para lidar com campos aninhados
    function toggleField(fieldName) {
        if (!ui.selectedType || !ui.selectedType.fields) return;

        const field = ui.selectedType.fields.find(f => f.name === fieldName);
        if (!field) return;

        if (isFieldInCurrentPath(fieldName)) {
            removeFieldFromQuery(fieldName);
        } else {
            addFieldToQuery(ui.selectedType.name, fieldName, isObjectField(field));

            // Se for um campo objeto, navegar para ele para mostrar sub-campos
            if (isObjectField(field)) {
                selectField(field);
            }
        }
    }

    // Função para adicionar um campo à query
    function addFieldToQuery(typeName, fieldName, isObject = false) {
        if (!selection.rootOperation && !ui.selectedField) return;

        // Garantir que o rootOperation esteja definido
        if (!selection.rootOperation && ui.selectedField) {
            selection.rootOperation = ui.selectedField;
        }

        // Adicionar o campo ao caminho atual
        if (!selection.currentPath) {
            selection.addedFields.add(fieldName);
        } else {
            if (!selection.nestedFields[selection.currentPath]) {
                selection.nestedFields[selection.currentPath] = new Set();
            }
            selection.nestedFields[selection.currentPath].add(fieldName);
        }

        rebuildFullQuery();
    }

    // Função para remover um campo da query
    function removeFieldFromQuery(fieldName) {
        if (!selection.rootOperation && !ui.selectedField) return;

        if (!selection.currentPath) {
            selection.addedFields.delete(fieldName);
        } else {
            if (selection.nestedFields[selection.currentPath]) {
                selection.nestedFields[selection.currentPath].delete(fieldName);
            }
        }

        rebuildFullQuery();
    }

    // NOVA função: Adiciona um argumento à query
    function addArgumentToQuery(argName) {
        if (!ui.selectedField && !selection.rootOperation) return;

        selection.addedArguments.add(argName);
        updateVariablesPanel();
        rebuildFullQuery();
    }

    // NOVA função: Remove um argumento da query
    function removeArgumentFromQuery(argName) {
        if (!ui.selectedField && !selection.rootOperation) return;

        selection.addedArguments.delete(argName);
        updateVariablesPanel();
        rebuildFullQuery();
    }

    // Atualizar a query no editor e aplicar formatação
    function updateQueryWithHighlight(queryText) {
        editor.query = queryText;
        // Se houver um elemento DOM onde exibir a query formatada, podemos atualizar aqui
        // Por exemplo, se estiver usando um editor Monaco ou CodeMirror, atualizaria o valor lá
    }

    // Função completamente reescrita para construir queries com campos aninhados
    function rebuildFullQuery() {
        if (!selection.rootOperation && !ui.selectedField) return;

        // Usar sempre a operação raiz para construir a query
        let operationField = selection.rootOperation ? selection.rootOperation.name : ui.selectedField.name;

        // Se não tivermos uma operação raiz, usar o campo selecionado atual
        if (!selection.rootOperation && ui.selectedField) {
            selection.rootOperation = ui.selectedField;
        }

        const opNameCapitalized = operationField.charAt(0).toUpperCase() + operationField.slice(1);

        // Obter argumentos da operação raiz
        let args = selection.rootOperation && selection.rootOperation.args ? selection.rootOperation.args : [];

        // Construir a definição de variáveis
        let variablesDefinition = '';
        if (selection.addedArguments.size > 0) {
            const variablesList = [];

            args.forEach(arg => {
                if (selection.addedArguments.has(arg.name)) {
                    const varName = `$${arg.name}`;
                    variablesList.push(`${varName}: ${getTypeName(arg.type)}`);
                }
            });

            if (variablesList.length > 0) {
                variablesDefinition = `(${variablesList.join(', ')})`;
            }
        }

        // Começar a query
        let query = `${ui.selectedOperation} ${opNameCapitalized}${variablesDefinition} {\n`;

        // Adicionar argumentos à operação
        let functionArgs = '';
        if (selection.addedArguments.size > 0) {
            const argsList = [];

            args.forEach(arg => {
                if (selection.addedArguments.has(arg.name)) {
                    const varName = `$${arg.name}`;
                    argsList.push(`${arg.name}: ${varName}`);
                }
            });

            if (argsList.length > 0) {
                functionArgs = `(${argsList.join(', ')})`;
            }
        }

        // Adicionar a operação principal
        query += `  ${operationField}${functionArgs} {\n`;

        // Novo algoritmo para construir a query sem duplicações
        function buildQueryStructure() {
            // Estrutura para rastrear o que já foi processado
            const processedPaths = new Set();

            // Conjunto para armazenar caminhos processados
            const addedFields = new Set();

            // Adicionar campos diretos da raiz
            if (selection.addedFields.size > 0) {
                const rootTypeObj = selection.rootOperation ?
                    getNestedType(selection.rootOperation.type) : null;

                selection.addedFields.forEach(field => {
                    let isObject = false;

                    if (rootTypeObj && rootTypeObj.fields) {
                        const fieldDef = rootTypeObj.fields.find(f => f.name === field);
                        if (fieldDef) {
                            isObject = isObjectField(fieldDef);
                        }
                    }

                    addedFields.add(field);

                    if (isObject) {
                        // Usar recursive para processar campos aninhados
                        addObjectFieldToQuery(field, [], 2);
                    } else {
                        query += `    ${field}\n`;
                    }
                });
            }

            // Função para adicionar um campo objeto e seus campos aninhados
            function addObjectFieldToQuery(fieldName, parentPath, depth) {
                const indent = '  '.repeat(depth);
                const currentPath = [...parentPath, fieldName];
                const currentPathStr = currentPath.join('.');

                // Se já processamos este caminho, não fazer nada
                if (processedPaths.has(currentPathStr)) {
                    return;
                }

                // Marcar o caminho como processado
                processedPaths.add(currentPathStr);

                // Começar o bloco do objeto
                query += `${indent}${fieldName} {\n`;

                // Verificar se há campos diretamente no objeto
                const directFields = selection.nestedFields[currentPathStr];
                if (directFields && directFields.size > 0) {
                    // Verificar o tipo do objeto atual para saber quais campos são objetos
                    let currentType = null;
                    let currentPathArr = currentPathStr.split('.');

                    if (currentPathArr.length === 1) {
                        // Campo na raiz da query
                        if (selection.rootOperation && getNestedType(selection.rootOperation.type)) {
                            const rootType = getNestedType(selection.rootOperation.type);
                            const fieldDef = rootType.fields.find(f => f.name === fieldName);
                            if (fieldDef) {
                                currentType = getNestedType(fieldDef.type);
                            }
                        }
                    } else {
                        // Campo aninhado, precisamos percorrer a hierarquia de tipos
                        let typeObj = selection.rootOperation ? getNestedType(selection.rootOperation.type) : null;

                        for (let i = 0; i < currentPathArr.length && typeObj; i++) {
                            const pathSegment = currentPathArr[i];
                            const fieldDef = typeObj.fields ? typeObj.fields.find(f => f.name === pathSegment) : null;

                            if (fieldDef) {
                                typeObj = getNestedType(fieldDef.type);
                            } else {
                                typeObj = null;
                            }
                        }

                        currentType = typeObj;
                    }

                    // Adicionar cada campo direto
                    directFields.forEach(subField => {
                        let isSubObject = false;

                        // Verificar se o subcampo é um objeto
                        if (currentType && currentType.fields) {
                            const subFieldDef = currentType.fields.find(f => f.name === subField);
                            if (subFieldDef) {
                                isSubObject = isObjectField(subFieldDef);
                            }
                        }

                        if (isSubObject) {
                            // Processar objetos aninhados recursivamente
                            addObjectFieldToQuery(subField, currentPath, depth + 1);
                        } else {
                            // Campo simples
                            query += `${indent}  ${subField}\n`;
                        }
                    });
                } else {
                    // Se não houver campos selecionados, adicionar um comentário
                    query += `${indent}  # Selecione campos\n`;
                }

                // Fechar o bloco do objeto
                query += `${indent}}\n`;
            }
        }

        // Construir a estrutura da query
        buildQueryStructure();

        // Fechar a query
        query += `  }\n}`;

        // Atualizar o editor
        editor.query = query;

        // Usar a função updateQueryEditor para atualizar o Monaco Editor
        updateQueryEditor();

        updateVariablesPanel();
    }

    // Modificar updateVariablesPanel para usar nomes de variáveis mais simples
    function updateVariablesPanel() {
        if (!ui.selectedField && selection.navigationPath.length === 0 && !selection.rootOperation) return;

        try {
            let variablesObj = {};
            if (editor.variables.trim()) {
                try {
                    variablesObj = JSON.parse(editor.variables);
                } catch (e) {
                    variablesObj = {};
                }
            }

            let args = selection.rootOperation && selection.rootOperation.args ? selection.rootOperation.args : [];

            Object.keys(variablesObj).forEach(varName => {
                if (!selection.addedArguments.has(varName)) {
                    delete variablesObj[varName];
                }
            });

            args.forEach(arg => {
                if (selection.addedArguments.has(arg.name)) {
                    const varName = arg.name;

                    if (variablesObj[varName] === undefined) {
                        if (getTypeName(arg.type).includes('String') || getTypeName(arg.type).includes('ID')) {
                            variablesObj[varName] = "";
                        } else if (getTypeName(arg.type).includes('Int') || getTypeName(arg.type).includes('Float')) {
                            variablesObj[varName] = 0;
                        } else if (getTypeName(arg.type).includes('Boolean')) {
                            variablesObj[varName] = false;
                        } else {
                            variablesObj[varName] = null;
                        }
                    }
                }
            });

            editor.variables = JSON.stringify(variablesObj, null, 2);
        } catch (e) {
            console.error('Erro ao atualizar variáveis:', e);
        }
    }

    // Modificar selectOperation para lidar com navegação aninhada
    function selectOperation(field) {
        ui.selectedField = field;
        const returnType = getNestedType(field.type);
        ui.selectedType = returnType;

        selection.addedFields.clear();
        selection.addedArguments.clear();
        selection.nestedFields = {};
        selection.navigationPath = [];
        selection.currentPath = '';

        selection.rootOperation = field;

        rebuildFullQuery();
        editor.variables = '{}';
        ui.activeTab = 'query';
    }

    // Modificar clearSelectedField para lidar com navegação aninhada
    function clearSelectedField() {
        selection.navigationPath = [];
        selection.currentPath = '';
        selection.rootOperation = null;

        ui.selectedField = null;
        ui.selectedType = null;
    }

    // NOVO: Actualiza o contexto do cursor para sugerir campos
    function updateCursorContext(event) {
        if (ui.selectedType && ui.selectedType.fields) {
            ui.contextFields = ui.selectedType.fields;
            ui.cursorContext = ui.selectedType.name;
        } else {
            ui.contextFields = [];
            ui.cursorContext = null;
        }
    }

    // NOVO: Adiciona um campo no ponto onde o cursor está
    function addFieldAtCursor(fieldName) {
        if (!editor.query) return;
        addFieldToQuery(ui.cursorContext, fieldName);
    }

    // Carrega o schema GraphQL usando introspection
    async function fetchSchema() {
        schema.loading = true;
        schema.error = null;

        try {
            const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
            types {
              ...FullType
            }
          }
        }

        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              name
              description
              type {
                ...TypeRef
              }
              defaultValue
            }
            type {
              ...TypeRef
            }
            isDeprecated
            deprecationReason
          }
          inputFields {
            name
            description
            type {
              ...TypeRef
            }
            defaultValue
          }
          interfaces {
            ...TypeRef
          }
          enumValues(includeDeprecated: true) {
            name
            description
            isDeprecated
            deprecationReason
          }
          possibleTypes {
            ...TypeRef
          }
        }

        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

            // Usar a função getAuthHeaders para obter os headers com autenticação
            const headers = getAuthHeaders();

            const response = await fetch(endpoint.value, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: introspectionQuery })
            });

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            // Processar o schema
            processSchema(result.data.__schema);

        } catch (error) {
            console.error('Erro ao carregar schema GraphQL:', error);
            schema.error = error.message || 'Erro ao carregar schema';
        } finally {
            schema.loading = false;
        }
    }

    // Processa e organiza o schema recebido
    function processSchema(schemaData) {
        if (!schemaData) return;

        schema.data = schemaData;
        schema.allTypes = schemaData.types || [];

        // Encontrar tipos raiz (Query, Mutation, Subscription)
        if (schemaData.queryType) {
            const queryType = schema.allTypes.find(t => t.name === schemaData.queryType.name);
            schema.queryTypes = queryType?.fields || [];
        }

        if (schemaData.mutationType) {
            const mutationType = schema.allTypes.find(t => t.name === schemaData.mutationType.name);
            schema.mutationTypes = mutationType?.fields || [];
        }

        if (schemaData.subscriptionType) {
            const subscriptionType = schema.allTypes.find(t => t.name === schemaData.subscriptionType.name);
            schema.subscriptionTypes = subscriptionType?.fields || [];
        }
    }

    // Seleciona um tipo para visualizar detalhes
    function selectType(type) {
        ui.selectedType = type;
        ui.activeTab = 'docs';
    }

    // Navega para um tipo pelo nome
    function navigateToType(typeName) {
        const type = schema.allTypes.find(t => t.name === typeName);
        if (type) {
            selectType(type);
        }
    }

    // Constrói uma consulta GraphQL a partir dos campos selecionados
    function buildQueryFromSelection() {
        if (selection.addedFields.size === 0) {
            editor.query = `# Selecione campos para construir sua consulta\n${ui.selectedOperation} {\n  \n}`;
            return;
        }

        const indent = '  ';
        let query = `${ui.selectedOperation} {\n`;

        const rootFields = Array.from(selection.addedFields)
            .filter(field => !field.includes('.'))
            .sort();

        for (const rootField of rootFields) {
            const hasNestedFields = Array.from(selection.addedFields)
                .some(field => field.startsWith(`${rootField}.`));

            if (hasNestedFields) {
                query += `${indent}${rootField} {\n`;

                const nestedFields = Array.from(selection.addedFields)
                    .filter(field => {
                        const parts = field.split('.');
                        return parts.length === 2 && parts[0] === rootField;
                    })
                    .map(field => field.split('.')[1])
                    .sort();

                for (const nestedField of nestedFields) {
                    query += `${indent}${indent}${nestedField}\n`;
                }

                query += `${indent}}\n`;
            } else {
                query += `${indent}${rootField}\n`;
            }
        }

        query += '}';
        editor.query = query;
    }

    // Executa a consulta atual
    async function executeQuery() {
        if (!editor.query.trim()) {
            alert('Por favor, insira uma consulta GraphQL');
            return;
        }

        editor.loading = true;
        editor.error = null;
        editor.response = null;

        try {
            // Analisar headers personalizados
            let customHeaders = {};
            try {
                if (editor.headers.trim()) {
                    customHeaders = JSON.parse(editor.headers);
                }
            } catch (e) {
                console.warn('Headers inválidos, usando apenas o padrão');
            }

            // Usar a função getAuthHeaders com os headers personalizados
            const headers = getAuthHeaders(customHeaders);

            // Preparar variáveis
            let variables = {};
            try {
                if (editor.variables.trim()) {
                    variables = JSON.parse(editor.variables);
                }
            } catch (e) {
                throw new Error('Erro ao processar variáveis: JSON inválido');
            }

            const startTime = performance.now();

            const response = await fetch(endpoint.value, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: editor.query,
                    variables
                })
            });

            const endTime = performance.now();
            editor.responseTime = Math.round(endTime - startTime);
            editor.responseStatus = response.status;

            const result = await response.json();
            editor.response = result;

            // Mudar para a tab de resposta
            ui.activeTab = 'query';

        } catch (error) {
            console.error('Erro ao executar consulta GraphQL:', error);
            editor.error = error.message || 'Erro ao executar consulta';
            editor.response = { error: editor.error };
        } finally {
            editor.loading = false;
        }
    }

    // Formata a consulta atual
    function prettifyQuery() {
        try {
            // Função básica de formatação (pode ser melhorada)
            let query = editor.query.trim()
                .replace(/\s+/g, ' ')
                .replace(/\s*{\s*/g, ' {\n  ')
                .replace(/\s*}\s*/g, '\n}\n')
                .replace(/\s*:\s*/g, ': ')
                .replace(/\s*,\s*/g, ',\n  ');

            let lines = query.split('\n');
            let indent = 0;
            let formattedLines = [];

            for (let line of lines) {
                let trimmed = line.trim();
                if (trimmed.endsWith('}')) {
                    indent = Math.max(0, indent - 1);
                }

                if (trimmed) {
                    formattedLines.push(' '.repeat(indent * 2) + trimmed);
                }

                if (trimmed.endsWith('{')) {
                    indent++;
                }
            }

            editor.query = formattedLines.join('\n');
        } catch (e) {
            console.error('Erro ao formatar consulta:', e);
        }
    }

    // Formata o JSON nas variáveis
    function prettifyVariables() {
        try {
            if (!editor.variables.trim()) return;

            const parsed = JSON.parse(editor.variables);
            editor.variables = JSON.stringify(parsed, null, 2);
        } catch (e) {
            alert('JSON inválido no campo de variáveis');
        }
    }

    // Formata o JSON nos headers
    function prettifyHeaders() {
        try {
            if (!editor.headers.trim()) return;

            const parsed = JSON.parse(editor.headers);
            editor.headers = JSON.stringify(parsed, null, 2);
        } catch (e) {
            alert('JSON inválido no campo de headers');
        }
    }

    // Copia a resposta para a área de transferência
    function copyResponse() {
        if (!editor.response) return;

        try {
            const text = typeof editor.response === 'string'
                ? editor.response
                : JSON.stringify(editor.response, null, 2);

            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('Resposta copiada para a área de transferência');
                })
                .catch(err => {
                    console.error('Erro ao copiar resposta:', err);
                });
        } catch (e) {
            console.error('Erro ao preparar resposta para cópia:', e);
        }
    }

    // Reinicia o explorer
    function resetExplorer() {
        ui.selectedType = null;
        ui.selectedField = null;
        ui.activeTab = 'query';
        selection.addedFields.clear();
        selection.addedArguments.clear();
        selection.nestedFields = {};
        selection.navigationPath = [];
        selection.currentPath = '';
        selection.rootOperation = null;
        editor.query = `# Write your GraphQL query here\n${ui.selectedOperation} {\n  \n}`;
    }

    // Função para atualizar o conteúdo do editor Monaco (com melhor tratamento de erros)
    function updateQueryEditor() {
        try {
            if (!queryEditor) {
                return; // Sair silenciosamente se o editor não estiver disponível
            }

            // Verificar se o modelo do editor ainda existe
            if (!queryEditor.getModel()) {
                console.warn('Modelo do editor não disponível');
                return;
            }

            const currentValue = queryEditor.getValue();
            if (currentValue !== editor.query) {
                queryEditor.setValue(editor.query);
            }
        } catch (error) {
            console.error('Erro ao atualizar o editor:', error);
            // Não recrie o editor aqui para evitar ciclos de erro
        }
    }

    // Função para inicializar o Monaco Editor (com melhor tratamento de erros)
    function initQueryEditor() {
        // Se o editor já existir e parecer válido, apenas tente atualizar o layout
        if (queryEditor) {
            try {
                queryEditor.layout();
                return;
            } catch (e) {
                console.warn('Erro ao ajustar layout do editor existente, recriando...', e);
                try {
                    queryEditor.dispose();
                } catch(err) {
                    // Ignorar erros ao tentar limpar
                }
                queryEditor = null;
            }
        }

        // Limpar timer anterior se existir
        if (editorInitTimer) {
            clearTimeout(editorInitTimer);
        }

        editorInitTimer = setTimeout(() => {
            if (!document.getElementById('graphqlQueryEditor')) {
                return; // Não inicializar se o contêiner não existir
            }

            try {
                // Verificar se o Monaco está disponível
                if (!window.monaco) {
                    console.warn('Monaco editor não disponível');
                    return;
                }

                // Criar o editor Monaco dentro de um bloco try/catch
                queryEditor = monaco.editor.create(document.getElementById('graphqlQueryEditor'), {
                    value: editor.query,
                    language: 'graphql',
                    theme: 'vs-dark',
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    fontSize: 14,
                    tabSize: 2
                });

                // Adicionar listener para atualizar o modelo quando o editor mudar (com tratamento de erro)
                queryEditor.onDidChangeModelContent(() => {
                    try {
                        if (queryEditor && queryEditor.getModel()) {
                            const value = queryEditor.getValue();
                            if (value !== editor.query) {
                                editor.query = value;
                            }
                        }
                    } catch (e) {
                        console.error('Erro ao atualizar valor do modelo', e);
                    }
                });

                ui.editorInitialized = true;

            } catch (error) {
                console.error('Erro ao inicializar o GraphQL Query Editor:', error);
                queryEditor = null;
                ui.editorInitialized = false;
            }
        }, 300);
    }

    // Função para limpar o editor com segurança
    function cleanupEditor() {
        if (editorInitTimer) {
            clearTimeout(editorInitTimer);
            editorInitTimer = null;
        }

        if (queryEditor) {
            try {
                // Salvar o valor atual antes de limpar
                const currentValue = queryEditor.getValue();
                if (currentValue) {
                    editor.query = currentValue;
                }

                queryEditor.dispose();
            } catch (e) {
                console.warn('Erro ao limpar editor', e);
            }
            queryEditor = null;
        }

        ui.editorInitialized = false;
    }

    // ------------------------
    // Lifecycle hooks
    // ------------------------

    onMounted(() => {
        console.log('GraphQL Explorer mounted');
        fetchSchema();
    });

    return {
        // Estado
        endpoint,
        schema,
        ui,
        editor,
        selection,

        // Computed
        filteredTypes,
        rootType,
        formattedResponse,
        formattedQuery,

        // Utils
        getTypeName,
        getNestedType,
        getAuthHeaders,

        // Métodos - Schema
        fetchSchema,
        navigateToType,
        selectType,

        // NOVAS funções para suporte ao estilo Apollo
        selectOperation,
        clearSelectedField,
        addFieldToQuery,
        updateCursorContext,
        addFieldAtCursor,
        isFieldSelected,
        isArgumentSelected,
        toggleField,
        toggleArgument,
        selectField,
        removeFieldFromQuery,
        addArgumentToQuery,
        removeArgumentFromQuery,

        // Métodos - Editor
        buildQueryFromSelection,
        executeQuery,
        prettifyQuery,
        prettifyVariables,
        prettifyHeaders,
        copyResponse,
        resetExplorer,

        // Adicionar novas funções para navegação aninhada
        navigateBack,
        isFieldInCurrentPath,
        isObjectField,

        // Adicionar métodos para o editor
        initQueryEditor,
        updateQueryEditor,
        cleanupEditor
    };
};
