const useGraphQLExplorer = () => {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    let queryEditor = null;
    let editorInitTimer = null;
    let initAttempts = 0;

    const endpoint = ref('http://localhost:4000/graphql');

    const schema = reactive({
        loading: false,
        error: null,
        data: null,
        queryTypes: [],
        mutationTypes: [],
        subscriptionTypes: [],
        allTypes: []
    });

    const ui = reactive({
        docExplorerOpen: true,
        selectedType: null,
        selectedField: null,
        selectedOperation: 'query',
        schemaFilter: '',
        activeTab: 'query',
        responseTab: 'formatted',
        cursorContext: null,
        contextFields: [],
        editorInitialized: false
    });

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

    const selection = reactive({
        fields: {},
        addedFields: new Set(),
        addedArguments: new Set(),
        nestedFields: {},
        navigationPath: [],
        currentPath: '',
        rootOperation: null,
    });

    const formattedQuery = computed(() => {
        if (!editor.query) return '';

        try {
            if (window.hljs) {
                return hljs.highlight(editor.query, { language: 'graphql' }).value;
            }

            return editor.query;
        } catch (err) {
            console.error(err);
            return editor.query;
        }
    });

    function getAuthHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        try {
            const storedAuth = localStorage.getItem('apiExplorerAuth');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData && authData.token) {
                    headers['Authorization'] = authData.token;
                }
            }
        } catch (e) {
            console.error(e);
        }

        return headers;
    }

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

    function getNestedType(typeObj) {
        if (!typeObj) return null;

        let finalType = typeObj;

        while (finalType.ofType) {
            finalType = finalType.ofType;
        }

        return schema.allTypes.find(t => t.name === finalType.name);
    }

    function isObjectField(field) {
        if (!field) return false;

        const nestedType = getNestedType(field.type);
        return nestedType &&
               nestedType.kind !== 'SCALAR' &&
               nestedType.kind !== 'ENUM' &&
               nestedType.fields &&
               nestedType.fields.length > 0;
    }

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

    const rootType = computed(() => {
        switch (ui.selectedOperation) {
            case 'query': return schema.data?.queryType;
            case 'mutation': return schema.data?.mutationType;
            case 'subscription': return schema.data?.subscriptionType;
            default: return schema.data?.queryType;
        }
    });

    const formattedResponse = computed(() => {
        if (!editor.response) return '';

        try {
            if (window.hljs) {
                const formatted = JSON.stringify(editor.response, null, 2);
                return hljs.highlight(formatted, { language: 'json' }).value;
            }

            return JSON.stringify(editor.response, null, 2);
        } catch (err) {
            return typeof editor.response === 'string'
                ? editor.response
                : JSON.stringify(editor.response);
        }
    });

    function selectField(field) {
        ui.selectedField = field;
        ui.selectedType = getNestedType(field.type);

        if (isObjectField(field)) {
            let newPath = field.name;
            if (selection.currentPath) {
                newPath = `${selection.currentPath}.${field.name}`;
            }

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

        rebuildFullQuery();
    }

    function navigateBack(index) {
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

        rebuildFullQuery();
    }

    function isFieldInCurrentPath(fieldName) {
        if (!selection.currentPath) {
            return selection.addedFields.has(fieldName);
        }

        return selection.nestedFields[selection.currentPath] &&
               selection.nestedFields[selection.currentPath].has(fieldName);
    }

    function isFieldSelected(fieldName) {
        return isFieldInCurrentPath(fieldName);
    }

    function isArgumentSelected(argName) {
        return selection.addedArguments.has(argName);
    }

    function toggleArgument(argName) {
        if (isArgumentSelected(argName)) {
            removeArgumentFromQuery(argName);
        } else {
            addArgumentToQuery(argName);
        }
    }

    function toggleField(fieldName) {
        if (!ui.selectedType || !ui.selectedType.fields) return;

        const field = ui.selectedType.fields.find(f => f.name === fieldName);
        if (!field) return;

        if (isFieldInCurrentPath(fieldName)) {
            removeFieldFromQuery(fieldName);
        } else {
            addFieldToQuery(ui.selectedType.name, fieldName, isObjectField(field));

            if (isObjectField(field)) {
                selectField(field);
            }
        }
    }

    function addFieldToQuery(typeName, fieldName, isObject = false) {
        if (!selection.rootOperation && !ui.selectedField) return;

        if (!selection.rootOperation && ui.selectedField) {
            selection.rootOperation = ui.selectedField;
        }

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

    function addArgumentToQuery(argName) {
        if (!ui.selectedField && !selection.rootOperation) return;

        selection.addedArguments.add(argName);
        updateVariablesPanel();
        rebuildFullQuery();
    }

    function removeArgumentFromQuery(argName) {
        if (!ui.selectedField && !selection.rootOperation) return;

        selection.addedArguments.delete(argName);
        updateVariablesPanel();
        rebuildFullQuery();
    }

    function updateQueryWithHighlight(queryText) {
        editor.query = queryText;
    }

    function rebuildFullQuery() {
        if (!selection.rootOperation && !ui.selectedField) return;

        let operationField = selection.rootOperation ? selection.rootOperation.name : ui.selectedField.name;

        if (!selection.rootOperation && ui.selectedField) {
            selection.rootOperation = ui.selectedField;
        }

        const opNameCapitalized = operationField.charAt(0).toUpperCase() + operationField.slice(1);

        let args = selection.rootOperation && selection.rootOperation.args ? selection.rootOperation.args : [];

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

        let query = `${ui.selectedOperation} ${opNameCapitalized}${variablesDefinition} {\n`;

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

        query += `  ${operationField}${functionArgs} {\n`;

        function buildQueryStructure() {
            const processedPaths = new Set();

            const addedFields = new Set();

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
                        addObjectFieldToQuery(field, [], 2);
                    } else {
                        query += `    ${field}\n`;
                    }
                });
            }

            function addObjectFieldToQuery(fieldName, parentPath, depth) {
                const indent = '  '.repeat(depth);
                const currentPath = [...parentPath, fieldName];
                const currentPathStr = currentPath.join('.');

                if (processedPaths.has(currentPathStr)) {
                    return;
                }

                processedPaths.add(currentPathStr);

                query += `${indent}${fieldName} {\n`;

                const directFields = selection.nestedFields[currentPathStr];
                if (directFields && directFields.size > 0) {
                    let currentType = null;
                    let currentPathArr = currentPathStr.split('.');

                    if (currentPathArr.length === 1) {
                        if (selection.rootOperation && getNestedType(selection.rootOperation.type)) {
                            const rootType = getNestedType(selection.rootOperation.type);
                            const fieldDef = rootType.fields.find(f => f.name === fieldName);
                            if (fieldDef) {
                                currentType = getNestedType(fieldDef.type);
                            }
                        }
                    } else {
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

                    directFields.forEach(subField => {
                        let isSubObject = false;

                        if (currentType && currentType.fields) {
                            const subFieldDef = currentType.fields.find(f => f.name === subField);
                            if (subFieldDef) {
                                isSubObject = isObjectField(subFieldDef);
                            }
                        }

                        if (isSubObject) {
                            addObjectFieldToQuery(subField, currentPath, depth + 1);
                        } else {
                            query += `${indent}  ${subField}\n`;
                        }
                    });
                } else {
                    query += `${indent}  # Selecione campos\n`;
                }

                query += `${indent}}\n`;
            }
        }

        buildQueryStructure();

        query += `  }\n}`;

        editor.query = query;

        updateQueryEditor();

        updateVariablesPanel();
    }

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
            console.error(e);
        }
    }

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

    function clearSelectedField() {
        selection.navigationPath = [];
        selection.currentPath = '';
        selection.rootOperation = null;

        ui.selectedField = null;
        ui.selectedType = null;
    }

    function updateCursorContext(event) {
        if (ui.selectedType && ui.selectedType.fields) {
            ui.contextFields = ui.selectedType.fields;
            ui.cursorContext = ui.selectedType.name;
        } else {
            ui.contextFields = [];
            ui.cursorContext = null;
        }
    }

    function addFieldAtCursor(fieldName) {
        if (!editor.query) return;
        addFieldToQuery(ui.cursorContext, fieldName);
    }

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

            processSchema(result.data.__schema);

        } catch (error) {
            console.error(error);
            schema.error = error.message || 'Erro ao carregar schema';
        } finally {
            schema.loading = false;
        }
    }

    function processSchema(schemaData) {
        if (!schemaData) return;

        schema.data = schemaData;
        schema.allTypes = schemaData.types || [];

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

    function selectType(type) {
        ui.selectedType = type;
        ui.activeTab = 'docs';
    }

    function navigateToType(typeName) {
        const type = schema.allTypes.find(t => t.name === typeName);
        if (type) {
            selectType(type);
        }
    }

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

    async function executeQuery() {
        if (!editor.query.trim())
            return;

        editor.loading = true;
        editor.error = null;
        editor.response = null;

        try {
            let customHeaders = {};
            try {
                if (editor.headers.trim()) {
                    customHeaders = JSON.parse(editor.headers);
                }
            } catch (e) {
                console.warn(e);
            }

            const headers = getAuthHeaders(customHeaders);

            let variables = {};
            try {
                if (editor.variables.trim()) {
                    variables = JSON.parse(editor.variables);
                }
            } catch (e) {
                throw new Error(e);
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

            ui.activeTab = 'query';

        } catch (error) {
            console.error(error);
            editor.error = error.message || 'Erro ao executar consulta';
            editor.response = { error: editor.error };
        } finally {
            editor.loading = false;
        }
    }

    function prettifyQuery() {
        try {
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
            console.error(e);
        }
    }

    function prettifyVariables() {
        try {
            if (!editor.variables.trim()) return;

            const parsed = JSON.parse(editor.variables);
            editor.variables = JSON.stringify(parsed, null, 2);
        } catch (e) {
            alert(e);
        }
    }

    function prettifyHeaders() {
        try {
            if (!editor.headers.trim()) return;

            const parsed = JSON.parse(editor.headers);
            editor.headers = JSON.stringify(parsed, null, 2);
        } catch (e) {
            alert('JSON inválido no campo de headers');
        }
    }

    function copyResponse() {
        if (!editor.response) return;

        try {
            const text = typeof editor.response === 'string'
                ? editor.response
                : JSON.stringify(editor.response, null, 2);

            navigator.clipboard.writeText(text)
                .catch(err => {
                    console.error(err);
                });
        } catch (e) {
            console.error(e);
        }
    }

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

    function updateQueryEditor() {
        try {
            if (!queryEditor)
                return;

            if (!queryEditor.getModel())
                return;

            const currentValue = queryEditor.getValue();

            if (currentValue !== editor.query)
                queryEditor.setValue(editor.query);
        } catch (error) {
            console.error(error);
        }
    }

    function initQueryEditor() {
        if (queryEditor) {
            try {
                queryEditor.layout();
                return;
            } catch (e) {
                console.warn(e);

                try {
                    queryEditor.dispose();
                } catch(err) {}

                queryEditor = null;
            }
        }

        if (editorInitTimer) {
            clearTimeout(editorInitTimer);
        }

        editorInitTimer = setTimeout(() => {
            if (!document.getElementById('graphqlQueryEditor')) {
                return;
            }

            try {
                if (!window.monaco)
                    return;

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

                queryEditor.onDidChangeModelContent(() => {
                    try {
                        if (queryEditor && queryEditor.getModel()) {
                            const value = queryEditor.getValue();
                            if (value !== editor.query) {
                                editor.query = value;
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                });

                ui.editorInitialized = true;

            } catch (error) {
                console.error(error);
                queryEditor = null;
                ui.editorInitialized = false;
            }
        }, 300);
    }

    function cleanupEditor() {
        if (editorInitTimer) {
            clearTimeout(editorInitTimer);
            editorInitTimer = null;
        }

        if (queryEditor) {
            try {
                const currentValue = queryEditor.getValue();
                if (currentValue) {
                    editor.query = currentValue;
                }

                queryEditor.dispose();
            } catch (e) {
                console.warn(e);
            }
            queryEditor = null;
        }

        ui.editorInitialized = false;
    }

    onMounted(() => {
        fetchSchema();
    });

    return {
        endpoint,
        schema,
        ui,
        editor,
        selection,

        filteredTypes,
        rootType,
        formattedResponse,
        formattedQuery,

        getTypeName,
        getNestedType,
        getAuthHeaders,

        fetchSchema,
        navigateToType,
        selectType,

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

        buildQueryFromSelection,
        executeQuery,
        prettifyQuery,
        prettifyVariables,
        prettifyHeaders,
        copyResponse,
        resetExplorer,

        navigateBack,
        isFieldInCurrentPath,
        isObjectField,

        initQueryEditor,
        updateQueryEditor,
        cleanupEditor
    };
};