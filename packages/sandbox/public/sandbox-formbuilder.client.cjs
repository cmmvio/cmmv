const useFormBuilder = () => {
    const { ref, reactive, onMounted, watch } = Vue;

    const components = ref([]);
    const selectedComponent = ref(null);
    const previewMode = ref(false);
    const isDragging = ref(false);
    const isLoading = ref(false);
    const contractFields = ref([]);
    const isReadOnly = ref(false);

    const ui = reactive({
        activePropertyTab: 'attributes',
        draggedComponent: null,
        dropPreviewPosition: 0,
        isDraggingNewComponent: false,
        targetComponent: null,
        dropPosition: 'before'
    });

    let currentContract = null;

    const formSettings = reactive({
        name: 'Contract Registration Form',
        submitButtonText: 'Submit'
    });

    let nextId = 1;

    function init(contract) {
        if (!contract) return this;

        currentContract = contract;
        isReadOnly.value = !!contract.options?.moduleContract;

        updateContractFields();
        loadFormFromContract();

        return this;
    }

    function addComponent(type) {
        if (isReadOnly.value) return;

        const component = {
            id: nextId++,
            type: type,
            label: getDefaultLabel(type),
            name: getDefaultName(type),
            required: false,
            placeholder: '',
            helpText: '',
            contractFieldId: null,
            readOnly: false,
            gridSize: 12,
            isResizing: false,
            styles: {
                bgColor: 'bg-white dark:bg-neutral-800',
                textColor: 'text-neutral-700 dark:text-neutral-300',
                textSize: 'text-sm',
                padding: 'px-3 py-2',
                margin: 'mb-4',
                rounded: 'rounded-md'
            }
        };

        if (type === 'select' || type === 'checkbox' || type === 'radio') {
            component.options = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' }
            ];
        } else if (type === 'textarea') {
            component.rows = 4;
        } else if (type === 'slider') {
            component.min = 0;
            component.max = 100;
            component.step = 1;
            component.defaultValue = 50;
        } else if (type === 'datepicker') {
            component.dateFormat = 'yyyy-MM-dd';
        } else if (type === 'hidden') {
            component.defaultValue = '';
        }

        components.value.push(component);
        selectComponent(component);
    }

    // Add component from contract field
    function addComponentFromField(field) {
        // Don't allow adding components in read-only mode
        if (isReadOnly.value) return;

        if (!field || !field.propertyKey) return;

        const component = createComponentFromField(field);
        components.value.push(component);
        selectComponent(component);
    }

    // Helper to create a component from a field (used both by addComponentFromField and generateAutoForm)
    function createComponentFromField(field) {
        if (!field || !field.propertyKey) return null;

        // Map contract field type to form component type
        let componentType = 'text';
        if (field.protoType === 'boolean' || field.protoType === 'bool') {
            componentType = 'checkbox';
        } else if (['int32', 'int64', 'float', 'double', 'number', 'bigint'].includes(field.protoType)) {
            componentType = 'number';
        } else if (field.enum) {
            componentType = 'select';
        }

        const component = {
            id: nextId++,
            type: componentType,
            label: field.propertyKey.charAt(0).toUpperCase() + field.propertyKey.slice(1),
            name: field.propertyKey,
            required: field.required || !field.nullable,
            placeholder: '',
            helpText: '',
            contractFieldId: field.propertyKey,
            readOnly: field.readOnly || false,
            gridSize: 12, // Tamanho padrão: ocupa as 12 colunas
            // Add default styles
            styles: {
                bgColor: 'bg-white dark:bg-neutral-800',
                textColor: 'text-neutral-700 dark:text-neutral-300',
                textSize: 'text-sm',
                padding: 'px-3 py-2',
                margin: 'mb-4',
                rounded: 'rounded-md'
            }
        };

        // Add options for select if it has enum values
        if (componentType === 'select' && field.enum) {
            component.options = field.enum.map((value, index) => ({
                value: value.toString(),
                label: field.enumNames?.[index] || value.toString()
            }));
        } else if (componentType === 'select') {
            component.options = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' }
            ];
        }

        return component;
    }

    // Generate form from contract fields
    function generateFromContractFields() {
        // Don't regenerate if in read-only mode
        if (isReadOnly.value) return;

        // Generate form using internal auto-generation
        generateAutoForm();
    }

    // Internal function to auto generate form from contract fields
    function generateAutoForm() {
        // Clear existing components
        components.value = [];
        selectedComponent.value = null;

        if (!currentContract || !currentContract.fields || !currentContract.fields.length) {
            return;
        }

        // Add a component for each field
        currentContract.fields.forEach(field => {
            // Skip hidden fields or fields that shouldn't be in forms
            const skipFields = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'createdBy', 'updatedBy', 'deletedBy', 'deleted'];
            if (!skipFields.includes(field.propertyKey)) {
                const component = createComponentFromField(field);
                if (component) {
                    components.value.push(component);
                }
            }
        });
    }

    // Save form to contract
    function saveFormToContract() {
        // Don't save if in read-only mode
        if (isReadOnly.value) return;

        if (!currentContract) {
            alert('No contract selected');
            return;
        }

        // Create form configuration object
        const formConfig = {
            settings: formSettings,
            components: components.value.map(component => ({
                id: component.id,
                type: component.type,
                label: component.label,
                name: component.name,
                required: component.required,
                placeholder: component.placeholder,
                helpText: component.helpText,
                contractFieldId: component.contractFieldId,
                readOnly: component.readOnly,
                gridSize: component.gridSize, // Salvar o tamanho da grade
                options: component.options ? [...component.options] : undefined,
                // Add styles to the saved configuration
                styles: component.styles ? { ...component.styles } : undefined
            }))
        };

        // Save to contract's viewForm property
        currentContract.viewForm = formConfig;

        // Show success message
        alert('Form configuration saved to contract successfully!');
    }

    // Select a component for editing
    function selectComponent(component) {
        console.log('selectComponent', component);
        // Don't allow selection in read-only mode
        if (isReadOnly.value) return;

        selectedComponent.value = component;
    }

    // Delete a component from the form
    function deleteComponent(id) {
        // Don't allow deletion in read-only mode
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index !== -1) {
            components.value.splice(index, 1);
            selectedComponent.value = null;
        }
    }

    // Toggle preview mode
    function togglePreviewMode() {
        // In read-only mode, don't allow toggling (always stay in preview)
        if (isReadOnly.value) return;

        previewMode.value = !previewMode.value;
        // When entering preview mode, clear any component selection
        if (previewMode.value) {
            selectedComponent.value = null;
        }
    }

    // Add option to a select/checkbox/radio component
    function addOption() {
        // Don't allow option modification in read-only mode
        if (isReadOnly.value) return;

        if (!selectedComponent.value) return;

        if (['select', 'checkbox', 'radio'].includes(selectedComponent.value.type)) {
            if (!selectedComponent.value.options) {
                selectedComponent.value.options = [];
            }

            const newOption = {
                value: `option${selectedComponent.value.options.length + 1}`,
                label: `Option ${selectedComponent.value.options.length + 1}`
            };

            selectedComponent.value.options.push(newOption);
        }
    }

    // Remove an option from a select/checkbox/radio component
    function removeOption(index) {
        // Don't allow option modification in read-only mode
        if (isReadOnly.value) return;

        if (!selectedComponent.value || !selectedComponent.value.options) return;

        selectedComponent.value.options.splice(index, 1);
    }

    // Generate HTML for a component
    function getComponentHtml(component, isPreview) {
        // In read-only mode, always render as if in preview
        if (isReadOnly.value) {
            isPreview = true;
        }

        // Extract styles for cleaner code
        const styles = component.styles || {
            bgColor: 'bg-white dark:bg-neutral-800',
            textColor: 'text-neutral-700 dark:text-neutral-300',
            textSize: 'text-sm',
            padding: 'px-3 py-2',
            margin: 'mb-4',
            rounded: 'rounded-md'
        };

        // Special case for hidden input - it doesn't need the usual wrapper in preview mode
        if (component.type === 'hidden' && isPreview) {
            return `<input type="hidden" name="${component.name}" value="${component.defaultValue || ''}">`;
        }

        let html = `
        <div class="${styles.margin}">
          <label class="block ${styles.textSize} font-medium mb-1 ${isPreview ? styles.textColor : 'text-neutral-300'}">
            ${component.label}${component.required ? ' <span class="text-red-500">*</span>' : ''}
            ${component.readOnly ? '<span class="text-yellow-500 ml-1">[Read-only]</span>' : ''}
            ${component.type === 'hidden' ? '<span class="bg-neutral-700 text-neutral-300 ml-1 px-1 py-0.5 text-xs rounded">[Hidden]</span>' : ''}
          </label>
      `;

        // Mark readonly fields as disabled
        const isDisabled = !isPreview || component.readOnly ? 'disabled' : '';

        switch (component.type) {
            case 'hidden':
                // Para o modo de edição, mostramos uma representação visual do campo oculto
                if (!isPreview) {
                    html += `
                    <div class="flex items-center">
                        <input type="text"
                            value="${component.defaultValue || ''}"
                            placeholder="Hidden value"
                            class="w-full ${styles.padding} border border-neutral-700 ${styles.rounded} bg-neutral-800 text-neutral-500 opacity-70"
                            disabled>
                    </div>`;
                } else {
                    // No modo de preview, adicione o campo oculto real
                    html += `<input type="hidden" name="${component.name}" value="${component.defaultValue || ''}">`;
                }
                break;
            case 'text':
                html += `<input type="text"
                  placeholder="${component.placeholder || ''}"
                  class="w-full ${styles.padding} border ${isPreview ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-700'} ${styles.rounded} ${styles.bgColor} ${styles.textColor} ${component.readOnly ? 'opacity-70' : ''}"
                  ${isDisabled}>`;
                break;
            case 'textarea':
                html += `<textarea
                  placeholder="${component.placeholder || ''}"
                  rows="${component.rows || 4}"
                  class="w-full ${styles.padding} border ${isPreview ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-700'} ${styles.rounded} ${styles.bgColor} ${styles.textColor} ${component.readOnly ? 'opacity-70' : ''}"
                  ${isDisabled}></textarea>`;
                break;
            case 'number':
                html += `<input type="number"
                  placeholder="${component.placeholder || ''}"
                  class="w-full ${styles.padding} border ${isPreview ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-700'} ${styles.rounded} ${styles.bgColor} ${styles.textColor} ${component.readOnly ? 'opacity-70' : ''}"
                  ${isDisabled}>`;
                break;
            case 'datepicker':
                html += `<input type="date"
                  placeholder="${component.placeholder || ''}"
                  class="w-full ${styles.padding} border ${isPreview ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-700'} ${styles.rounded} ${styles.bgColor} ${styles.textColor} ${component.readOnly ? 'opacity-70' : ''}"
                  ${isDisabled}>`;
                break;
            case 'select':
                html += `
            <select class="w-full ${styles.padding} border ${isPreview ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-700'} ${styles.rounded} ${styles.bgColor} ${styles.textColor} ${component.readOnly ? 'opacity-70' : ''}"
                   ${isDisabled}>
          `;

                if (component.options) {
                    component.options.forEach(option => {
                        html += `<option value="${option.value}">${option.label}</option>`;
                    });
                }

                html += `</select>`;
                break;
            case 'radio':
                if (component.options) {
                    component.options.forEach((option, idx) => {
                        html += `
                <div class="flex items-center mt-2">
                  <input type="radio" id="radio_${option.value}" name="${component.name || 'radio_group'}" value="${option.value}"
                        class="mr-2 ${component.readOnly ? 'opacity-70' : ''}"
                        ${isDisabled}>
                  <label for="radio_${option.value}" class="text-sm ${isPreview ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-300'}">${option.label}</label>
                </div>
              `;
                    });
                }
                break;
            case 'checkbox':
                if (component.options) {
                    component.options.forEach(option => {
                        html += `
                <div class="flex items-center mt-2">
                  <input type="checkbox" id="check_${option.value}" value="${option.value}"
                        class="rounded border-neutral-300 dark:border-neutral-600 mr-2 ${component.readOnly ? 'opacity-70' : ''}"
                        ${isDisabled}>
                  <label for="check_${option.value}" class="text-sm ${isPreview ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-300'}">${option.label}</label>
                </div>
              `;
                    });
                } else {
                    html += `
              <div class="flex items-center mt-2">
                <input type="checkbox" class="rounded border-neutral-300 dark:border-neutral-600 mr-2 ${component.readOnly ? 'opacity-70' : ''}"
                      ${isDisabled}>
                <label class="text-sm ${isPreview ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-300'}">Yes</label>
              </div>
            `;
                }
                break;
            case 'slider':
                const min = component.min || 0;
                const max = component.max || 100;
                const step = component.step || 1;
                const defaultValue = component.defaultValue || (min + max) / 2;

                html += `
              <div class="flex flex-col">
                <div class="flex justify-between mb-1 text-xs ${isPreview ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400'}">
                  <span>${min}</span>
                  <span>${max}</span>
                </div>
                <input
                  type="range"
                  min="${min}"
                  max="${max}"
                  step="${step}"
                  value="${defaultValue}"
                  class="w-full ${component.readOnly ? 'opacity-70' : ''}"
                  ${isDisabled}>
                <div class="text-center mt-1 text-xs ${isPreview ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-400'}">
                  Value: ${defaultValue}
                </div>
              </div>
            `;
                break;
        }

        if (component.helpText) {
            html += `<p class="mt-1 text-xs ${isPreview ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-500'}">${component.helpText}</p>`;
        }

        html += `</div>`;
        return html;
    }

    // Drag and drop handlers
    function handleDragStart(event, type) {
        // Prevent drag in read-only mode
        if (isReadOnly.value) {
            event.preventDefault();
            return false;
        }

        event.dataTransfer.setData('componentType', type);
        event.dataTransfer.effectAllowed = 'copy';
        isDragging.value = true;
        ui.isDraggingNewComponent = true; // Indica que estamos arrastando do sidebar
    }

    function handleDragOver(event) {
        // Prevent drop in read-only mode
        if (isReadOnly.value) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function handleDragLeave(event) {
        // Only set to false if we're leaving the main drop area
        if (!event.currentTarget.contains(event.relatedTarget)) {
            isDragging.value = false;
            ui.isDraggingNewComponent = false;
        }
    }

    function handleDrop(event) {
        // Prevent drop in read-only mode
        if (isReadOnly.value) {
            return;
        }

        event.preventDefault();
        isDragging.value = false;
        ui.isDraggingNewComponent = false;

        const componentType = event.dataTransfer.getData('componentType');
        if (componentType) {
            addComponent(componentType);
        }
    }

    // Helper functions
    function getDefaultLabel(type) {
        const labels = {
            'text': 'Text Input',
            'textarea': 'Text Area',
            'number': 'Number',
            'datepicker': 'Date Picker',
            'select': 'Dropdown',
            'radio': 'Radio Buttons',
            'checkbox': 'Checkbox',
            'slider': 'Slider',
            'hidden': 'Hidden Input'
        };
        return labels[type] || 'New Field';
    }

    function getDefaultName(type) {
        // Convert to snake_case
        return getDefaultLabel(type).toLowerCase().replace(/\s+/g, '_');
    }

    // Handle form submission in preview mode
    function handleFormSubmit() {
        console.log('Form submitted with data:', components.value);
        alert('Form submitted successfully!');
    }

    // Update contract fields from the current contract
    function updateContractFields() {
        if (currentContract && currentContract.fields) {
            contractFields.value = currentContract.fields;
        } else {
            contractFields.value = [];
        }
    }

    // Load form configuration from the current contract
    function loadFormFromContract() {
        if (!currentContract) return;

        isLoading.value = true;

        try {
            let formLoaded = false;

            // Load saved form configuration if available
            if (currentContract.viewForm) {
                // Load form settings
                if (currentContract.viewForm.settings) {
                    Object.assign(formSettings, currentContract.viewForm.settings);
                }

                // Load components
                if (currentContract.viewForm.components && Array.isArray(currentContract.viewForm.components)) {
                    components.value = currentContract.viewForm.components;

                    // Ensure each component has a readOnly property and styles
                    components.value.forEach(component => {
                        // If the component has a contractFieldId, get the field's readOnly value
                        if (component.contractFieldId) {
                            const field = contractFields.value.find(f =>
                                f.propertyKey === component.contractFieldId);

                            if (field) {
                                component.readOnly = field.readOnly || false;
                            }
                        }

                        // If readOnly is not set, default to false
                        if (component.readOnly === undefined) {
                            component.readOnly = false;
                        }

                        // Ensure styles exist
                        if (!component.styles) {
                            component.styles = {
                                bgColor: 'bg-white dark:bg-neutral-800',
                                textColor: 'text-neutral-700 dark:text-neutral-300',
                                textSize: 'text-sm',
                                padding: 'px-3 py-2',
                                margin: 'mb-4',
                                rounded: 'rounded-md'
                            };
                        }

                        // Ensure gridSize exists
                        if (component.gridSize === undefined) {
                            component.gridSize = 12;
                        }
                    });

                    // Reset nextId to be higher than any existing component id
                    nextId = Math.max(0, ...components.value.map(c => c.id || 0)) + 1;
                    formLoaded = true;
                }
            }

            // If in read-only mode and no form configuration was loaded,
            // automatically generate the form from contract fields
            if (isReadOnly.value && !formLoaded) {
                generateAutoForm();
            }

            // When it's a module contract or any time we have a read-only contract,
            // enable preview mode to show fields as disabled
            if (isReadOnly.value) {
                previewMode.value = true;
                selectedComponent.value = null;
            }
        } catch (error) {
            console.error("Error loading form from contract:", error);
        } finally {
            isLoading.value = false;
        }
    }

    // Move a component up in the list
    function moveComponentUp(id) {
        // Don't allow moving in read-only mode
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index > 0) {
            // Swap with the previous component
            [components.value[index], components.value[index - 1]] =
            [components.value[index - 1], components.value[index]];
        }
    }

    // Move a component down in the list
    function moveComponentDown(id) {
        // Don't allow moving in read-only mode
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index >= 0 && index < components.value.length - 1) {
            // Swap with the next component
            [components.value[index], components.value[index + 1]] =
            [components.value[index + 1], components.value[index]];
        }
    }

    // Handle drag start for component reordering
    function handleComponentDragStart(event, component) {
        // Don't allow dragging in read-only mode
        if (isReadOnly.value || previewMode.value) {
            event.preventDefault();
            return false;
        }

        // Prevent text selection during drag
        event.stopPropagation();

        // Store the dragged component
        ui.draggedComponent = component;

        // Set data transfer to make drag work across browsers
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({id: component.id}));

        // Set initial drop position based on the dragged component's position
        const componentElement = event.target.closest('.mb-4.relative');
        if (componentElement) {
            // Posicionar inicialmente no topo do componente arrastado
            ui.dropPreviewPosition = componentElement.offsetTop;
            // Também define o target como o próprio componente no início
            ui.targetComponent = component;
            ui.dropPosition = 'before'; // Default position
        }

        // Add a delay to allow dragging visual to appear
        setTimeout(() => {
            event.target.classList.add('opacity-50');
        }, 0);
    }

    // Handle drag over for component reordering
    function handleComponentDragOver(event, targetComponent) {
        // Don't allow dragging in read-only mode
        if (isReadOnly.value || previewMode.value || !ui.draggedComponent) return;

        // Se for o mesmo componente, ignorar
        if (ui.draggedComponent.id === targetComponent.id) {
            // Esconde o indicador quando arrasta sobre o próprio componente
            ui.dropPreviewPosition = -1000;
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        // Salvar o componente alvo atual
        ui.targetComponent = targetComponent;

        // Calcular a posição da barra indicadora
        const wrapper = event.target.closest('.mb-4.relative');
        if (!wrapper) return;

        // Obter a posição e dimensões do wrapper
        const rect = wrapper.getBoundingClientRect();
        const mouseY = event.clientY - rect.top;
        const midPoint = rect.height / 2;

        // Definir a posição de inserção (antes ou depois)
        if (mouseY < midPoint) {
            ui.dropPosition = 'before';
            // Posicionar no topo do componente
            ui.dropPreviewPosition = wrapper.offsetTop;
        } else {
            ui.dropPosition = 'after';
            // Posicionar no fundo do componente
            ui.dropPreviewPosition = wrapper.offsetTop + wrapper.offsetHeight;
        }

        // Adicionar feedback visual ao componente alvo
        wrapper.classList.add('bg-blue-500/10');
    }

    // Handle drag leave for component reordering
    function handleComponentDragLeave(event) {
        const wrapper = event.target.closest('.mb-4.relative');
        if (wrapper) {
            wrapper.classList.remove('bg-blue-500/10');
        }
    }

    // Handle drag end for component reordering
    function handleComponentDragEnd(event, component) {
        event.preventDefault();
        event.stopPropagation();

        // Limpar qualquer alteração visual
        const wrappers = document.querySelectorAll('.mb-4.relative');
        wrappers.forEach(wrapper => {
            wrapper.classList.remove('bg-blue-500/10', 'opacity-50');
        });

        // Verificar se temos um destino para realizar a reordenação
        if (ui.draggedComponent && ui.targetComponent && ui.draggedComponent.id !== ui.targetComponent.id) {
            // Obter as posições no array
            const draggedIndex = components.value.findIndex(c => c.id === ui.draggedComponent.id);
            const targetIndex = components.value.findIndex(c => c.id === ui.targetComponent.id);

            if (draggedIndex >= 0 && targetIndex >= 0) {
                // Cria uma cópia do array para preservar a reatividade
                const updatedComponents = [...components.value];

                // Remove o componente arrastado
                const [draggedComponent] = updatedComponents.splice(draggedIndex, 1);

                // Recalcula o índice de destino após a remoção
                let insertPosition = targetIndex;
                if (draggedIndex < targetIndex) {
                    insertPosition--;
                }

                // Insere na posição correta baseado na posição do mouse
                if (ui.dropPosition === 'before') {
                    // Inserir antes do alvo
                    updatedComponents.splice(insertPosition, 0, draggedComponent);
                } else {
                    // Inserir depois do alvo
                    updatedComponents.splice(insertPosition + 1, 0, draggedComponent);
                }

                // Atualiza o array de componentes
                components.value = updatedComponents;
            }
        }

        // Adicionar novo componente se estiver arrastando do sidebar
        const componentType = event.dataTransfer.getData('componentType');
        if (componentType && ui.targetComponent) {
            const index = components.value.findIndex(c => c.id === ui.targetComponent.id);
            if (index !== -1) {
                // Criar novo componente
                const newComponent = {
                    id: nextId++,
                    type: componentType,
                    label: getDefaultLabel(componentType),
                    name: getDefaultName(componentType),
                    required: false,
                    placeholder: '',
                    helpText: '',
                    contractFieldId: null,
                    readOnly: false,
                    styles: {
                        bgColor: 'bg-white dark:bg-neutral-800',
                        textColor: 'text-neutral-700 dark:text-neutral-300',
                        textSize: 'text-sm',
                        padding: 'px-3 py-2',
                        margin: 'mb-4',
                        rounded: 'rounded-md'
                    }
                };

                // Adicionar opções para tipos específicos
                if (componentType === 'select' || componentType === 'checkbox' || componentType === 'radio') {
                    newComponent.options = [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' }
                    ];
                }

                // Inserir antes ou depois conforme a posição
                if (ui.dropPosition === 'before') {
                    components.value.splice(index, 0, newComponent);
                } else {
                    components.value.splice(index + 1, 0, newComponent);
                }
            }
        }

        // Resetar todos os estados
        ui.draggedComponent = null;
        ui.targetComponent = null;
        ui.dropPreviewPosition = 0;
        ui.dropPosition = 'before';
        isDragging.value = false;
        ui.isDraggingNewComponent = false;
    }

    // Add support for drop on empty form and end of list
    function handleCanvasDrop(event) {
        // Don't allow dropping in read-only mode
        if (isReadOnly.value || previewMode.value) return;

        event.preventDefault();
        event.stopPropagation();

        // Verificar se é um novo componente do sidebar
        const componentType = event.dataTransfer.getData('componentType');
        if (componentType) {
            // Adicionar novo componente ao final
            addComponent(componentType);
            isDragging.value = false;
            ui.isDraggingNewComponent = false;
            return;
        }

        // Se for um componente existente, move para o final
        if (!ui.draggedComponent) return;

        // Get the position of dragged component
        const draggedIndex = components.value.findIndex(c => c.id === ui.draggedComponent.id);

        if (draggedIndex < 0) return;

        // Remove from current position and add to end
        const [draggedComponent] = components.value.splice(draggedIndex, 1);
        components.value.push(draggedComponent);

        // Reset state
        ui.draggedComponent = null;
        ui.targetComponent = null;
        ui.dropPreviewPosition = 0;
        isDragging.value = false;
        ui.isDraggingNewComponent = false;
    }

    // Adicionar esta função em vez de setupResizeHandlers
    function initResize(event, component) {
        // Prevent event propagation
        event.preventDefault();
        event.stopPropagation();

        // Ignore if in preview or read-only mode
        if (previewMode.value || isReadOnly.value) return;

        // Get component element
        const componentElement = event.target.closest('.grid-component');
        if (!componentElement) return;

        // Initial values
        const startX = event.clientX;
        const startWidth = componentElement.getBoundingClientRect().width;
        const containerWidth = componentElement.parentElement.getBoundingClientRect().width;
        const startGridSize = component.gridSize;
        const columnWidth = containerWidth / 12;

        // Add visual feedback during resize
        document.body.classList.add('resizing');
        componentElement.classList.add('resizing');

        // Ensure the component is selected
        selectComponent(component);

        // Set the resizing flag
        component.isResizing = true;

        // Event handlers
        function handleMouseMove(e) {
            // Calculate how many columns to change by
            const dx = e.clientX - startX;
            const columnsChange = Math.round(dx / columnWidth);
            const newGridSize = Math.max(1, Math.min(12, startGridSize + columnsChange));

            // Update component model
            component.gridSize = newGridSize;

            // Update visual size during drag
            componentElement.style.gridColumn = `span ${newGridSize}`;
        }

        function handleMouseUp() {
            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Remove visual feedback
            document.body.classList.remove('resizing');
            componentElement.classList.remove('resizing');

            // Clear inline style as Tailwind classes will handle it now
            componentElement.style.gridColumn = '';

            // Clear the resizing flag
            component.isResizing = false;
        }

        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // Adicione esta função antes do bloco return
    function setupResizeHandlers() {
        // Não precisamos mais desta função já que estamos usando initResize diretamente
        // Mantemos apenas para compatibilidade e evitar erros
        console.log('Using direct resize handlers instead of setup');
    }

    // Adicione esta função para inicializar se precisar
    function initializeResizing() {
        // Função vazia para compatibilidade da API
        console.log('Resize handlers are initialized directly');
    }

    // Return the API
    return {
        components,
        selectedComponent,
        previewMode,
        formSettings,
        contractFields,
        isDragging,
        isLoading,
        isReadOnly,
        ui,
        init,
        addComponent,
        addComponentFromField,
        selectComponent,
        deleteComponent,
        addOption,
        removeOption,
        generateFromContractFields,
        saveFormToContract,
        getComponentHtml,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFormSubmit,
        togglePreviewMode,
        moveComponentUp,
        moveComponentDown,
        handleComponentDragStart,
        handleComponentDragOver,
        handleComponentDragLeave,
        handleComponentDragEnd,
        handleCanvasDrop,
        initResize,
        setupResizeHandlers,
        initializeResizing
    };
};
