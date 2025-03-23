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
        activeElementsTab: 'fields',
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

        else if (type === 'heading') {
            component.headingSize = 'h1';
            component.content = 'Heading Text';
        } else if (type === 'divider') {
            component.dividerStyle = 'solid';
        } else if (type === 'quote') {
            component.content = 'This is a quotation.';
            component.author = '';
        } else if (type === 'alert') {
            component.alertType = 'info';
            component.content = 'This is an alert message.';
        } else if (type === 'image') {
            component.imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP8AAADGCAMAAAAqo6adAAAAKlBMVEXQ0NDw8PDOzs7y8vLa2trf39/b29vr6+vW1tbU1NTl5eXt7e3n5+fh4eHlFfvKAAADdUlEQVR4nO2dCYKCMBAEMQG59P/fXVB0FckB5JjMdL0gVYSsSMxWFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQglJ9V9ddr1TukeRA1cOon7RNJS5Bc9H6sjAlGPrcA0qJ6sa3/CtBI2cKqEav9OcCt9zDSoW6/9rPAdrcA0vDdPW39MUE6Az6U4BBwhowmvSnAHXuwUXHcPMvjLmHFx+L/TQBrrmHFxvT4vdaApmvAKq1+l8098+BVnv+N4D5j9/iP+QeYVyuLn/mC4B9+Ztg7m/96z8z8vZ3XX/u8792+d94+/cu/3vuEUbGcftzfwJSN8fnv9wDjI19AeB++1fWx//Jv8s9vOjYPgEKuPzWJ0D2T38PzPrMH/4WTM+A+s5/9j/oNl5/SPn290G/fv0l7AVYVQ3fU0DrtpekX6l+eL8Ant+A16LsZ1R1HdpZf7w1sq79m+fGD5nbPwAAAAAAAAAAAADACUS8RjJT66vg79RUrS+CA6jHDgOxAdSywUJoAPXeX6LlvVL51BcZQH3tLpIXYLW5SlqAn71logKoja11ggJs6QsKsK0vJoBJX0gAs76MANZdxfwDOH5VwT2A60clvAPY7n0BAXz0GQfw02cbwFefawBvfZ4BduhzDLBLn1+AnfoFBNjz8y//pa+UAKrZ8a31EX3aAeaDobwDHNOnHOB5Lpbv+A7q0w3wOhbMbwYc1qca4P9UNJ8AJ/RpBvg8FM4d4JQ+xQDfZ+K5ApzUpxdgfSSgNcDRlZ9ugN8TES0BQujTCrB1IKQ5QBB9SgG2z8M0jS+QPp0ApuNAt2dAMH0qAYynoW4GCKhPI4BZfytAUH0KAWz6vwEC6+cPYNdfBwiunzuAS/87QAT9vAHc+p/ji6KfM4CP/v8MiKSfL4Cf/itANP1cAXz1nwEi6ucJ4K8/j891auxJ0gfYo5+A1AGI6acOQE4/bQCC+ikDkNRPF4CofqoAZPXTBCCsnyIAaf34AYjrxw5AXj9ugAL0YwYoQj9egEL0YwUoRj9OgIL0YwQoSj98gML0QwcoTj9sgAL1QwYoUj9cgEL1QwUoVj9MgIL1QwQoWv98gML1zwYoXv9cAAb6ZwKw0D8egIn+0QBs9I8FYKR/JAAr/f0BmOnvDcBOf18Ahvq7AnDU5/+fSQEAAAAAAAAAAABM9LL5A+aIOy3aq/BcAAAAAElFTkSuQmCC';
            component.imageAlt = 'Image description';
            component.caption = '';
            component.imageWidth = 'w-full';
        } else if (type === 'link') {
            component.linkUrl = '#';
            component.linkText = 'Click here';
            component.openInNewTab = false;
        } else if (type === 'html') {
            component.htmlContent = '<p>Add your HTML content here.</p>';
        }

        components.value.push(component);
        selectComponent(component);
    }

    function addComponentFromField(field) {
        if (isReadOnly.value) return;

        if (!field || !field.propertyKey) return;

        const component = createComponentFromField(field);
        components.value.push(component);
        selectComponent(component);
    }

    function createComponentFromField(field) {
        if (!field || !field.propertyKey) return null;

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
            gridSize: 12,
            styles: {
                bgColor: 'bg-white dark:bg-neutral-800',
                textColor: 'text-neutral-700 dark:text-neutral-300',
                textSize: 'text-sm',
                padding: 'px-3 py-2',
                margin: 'mb-4',
                rounded: 'rounded-md'
            }
        };

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

    function generateFromContractFields() {
        if (isReadOnly.value) return;

        generateAutoForm();
    }

    function generateAutoForm() {
        components.value = [];
        selectedComponent.value = null;

        if (!currentContract || !currentContract.fields || !currentContract.fields.length) {
            return;
        }

        currentContract.fields.forEach(field => {
            const skipFields = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'createdBy', 'updatedBy', 'deletedBy', 'deleted'];
            if (!skipFields.includes(field.propertyKey)) {
                const component = createComponentFromField(field);
                if (component) {
                    components.value.push(component);
                }
            }
        });
    }

    function saveFormToContract() {
        if (isReadOnly.value) return;

        if (!currentContract) {
            alert('No contract selected');
            return;
        }

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
                gridSize: component.gridSize,
                options: component.options ? [...component.options] : undefined,
                styles: component.styles ? { ...component.styles } : undefined
            }))
        };

        currentContract.viewForm = formConfig;

        alert('Form configuration saved to contract successfully!');
    }

    function selectComponent(component) {
        if (isReadOnly.value) return;

        selectedComponent.value = component;
    }

    function deleteComponent(id) {
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index !== -1) {
            components.value.splice(index, 1);
            selectedComponent.value = null;
        }
    }

    function togglePreviewMode() {
        if (isReadOnly.value) return;

        previewMode.value = !previewMode.value;
        if (previewMode.value) {
            selectedComponent.value = null;
        }
    }

    function addOption() {
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

    function removeOption(index) {
        if (isReadOnly.value) return;

        if (!selectedComponent.value || !selectedComponent.value.options) return;

        selectedComponent.value.options.splice(index, 1);
    }

    function getComponentHtml(component, isPreview) {
        if (isReadOnly.value) {
            isPreview = true;
        }

        const styles = component.styles || {
            bgColor: 'bg-white dark:bg-neutral-800',
            textColor: 'text-neutral-700 dark:text-neutral-300',
            textSize: 'text-sm',
            padding: 'px-3 py-2',
            margin: 'mb-4',
            rounded: 'rounded-md'
        };

        if (component.type === 'hidden' && isPreview) {
            return `<input type="hidden" name="${component.name}" value="${component.defaultValue || ''}">`;
        }

        const isStaticComponent = ['heading', 'divider', 'quote', 'alert', 'image', 'link', 'html'].includes(component.type);

        let html = '';

        if (isStaticComponent) {
            html = `<div class="${styles.margin}">`;
        } else {
            html = `
                <div class="${styles.margin}">
                  <label class="block ${styles.textSize} font-medium mb-1 ${isPreview ? styles.textColor : 'text-neutral-300'}">
                    ${component.label}${component.required ? ' <span class="text-red-500">*</span>' : ''}
                    ${component.readOnly ? '<span class="text-yellow-500 ml-1">[Read-only]</span>' : ''}
                    ${component.type === 'hidden' ? '<span class="bg-neutral-700 text-neutral-300 ml-1 px-1 py-0.5 text-xs rounded">[Hidden]</span>' : ''}
                  </label>
              `;
        }

        const isDisabled = !isPreview || component.readOnly ? 'disabled' : '';

        switch (component.type) {
            case 'heading':
                const headingSize = component.headingSize || 'h1';
                const headingSizeClasses = {
                    h1: 'text-3xl font-bold',
                    h2: 'text-2xl font-bold',
                    h3: 'text-xl font-bold',
                    h4: 'text-lg font-bold',
                    h5: 'text-base font-bold',
                    h6: 'text-sm font-bold'
                };
                html += `<${headingSize} class="${headingSizeClasses[headingSize]} ${styles.textColor}">${component.content || 'Heading Text'}</${headingSize}>`;
                break;

            case 'divider':
                const dividerStyle = component.dividerStyle || 'solid';
                const dividerClasses = {
                    solid: 'border-t',
                    dashed: 'border-t border-dashed',
                    dotted: 'border-t border-dotted'
                };
                html += `<hr class="${dividerClasses[dividerStyle]} border-neutral-300 dark:border-neutral-600 my-4">`;
                break;

            case 'quote':
                html += `
                    <blockquote class="pl-4 border-l-4 border-neutral-300 dark:border-neutral-600 italic ${styles.textColor}">
                        <p>${component.content || 'This is a quotation.'}</p>
                        ${component.author ? `<footer class="text-sm text-neutral-500 mt-2">— ${component.author}</footer>` : ''}
                    </blockquote>
                `;
                break;

            case 'alert':
                const alertType = component.alertType || 'info';
                const alertClasses = {
                    info: 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                    success: 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-300',
                    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                    error: 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-300'
                };
                html += `
                    <div class="p-4 border-l-4 rounded-r ${alertClasses[alertType]}">
                        <div class="flex">
                            <div class="ml-3">
                                <p class="text-sm">${component.content || 'This is an alert message.'}</p>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'image':
                html += `
                    <figure class="flex flex-col items-center">
                        <img
                            src="${component.imageUrl || 'https://via.placeholder.com/800x400?text=Image'}"
                            alt="${component.imageAlt || 'Image'}"
                            class="${component.imageWidth || 'w-full'} ${styles.rounded}"
                        >
                        ${component.caption ? `<figcaption class="text-sm text-center text-neutral-500 mt-2">${component.caption}</figcaption>` : ''}
                    </figure>
                `;
                break;

            case 'link':
                html += `
                    <a
                        href="${component.linkUrl || '#'}"
                        class="text-blue-600 hover:underline dark:text-blue-400"
                        ${component.openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''}
                    >
                        ${component.linkText || 'Click here'}
                    </a>
                `;
                break;

            case 'html':
                html += `
                    <div class="static-html">
                        ${component.htmlContent || '<p>Add your HTML content here.</p>'}
                    </div>
                `;
                break;

            case 'hidden':
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

        if (component.helpText && !isStaticComponent) {
            html += `<p class="mt-1 text-xs ${isPreview ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-500'}">${component.helpText}</p>`;
        }

        html += `</div>`;
        return html;
    }

    function handleDragStart(event, type) {
        if (isReadOnly.value) {
            event.preventDefault();
            return false;
        }

        event.dataTransfer.setData('componentType', type);
        event.dataTransfer.effectAllowed = 'copy';
        isDragging.value = true;
        ui.isDraggingNewComponent = true;
    }

    function handleDragOver(event) {
        if (isReadOnly.value) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function handleDragLeave(event) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            isDragging.value = false;
            ui.isDraggingNewComponent = false;
        }
    }

    function handleDrop(event) {
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
            'hidden': 'Hidden Input',
            'heading': 'Heading',
            'divider': 'Divider',
            'quote': 'Quote',
            'alert': 'Alert',
            'image': 'Image',
            'link': 'Link',
            'html': 'HTML Content'
        };
        return labels[type] || 'New Field';
    }

    function getDefaultName(type) {
        return getDefaultLabel(type).toLowerCase().replace(/\s+/g, '_');
    }

    function handleFormSubmit() {
        alert('Form submitted successfully!');
    }

    function updateContractFields() {
        if (currentContract && currentContract.fields) {
            contractFields.value = currentContract.fields;
        } else {
            contractFields.value = [];
        }
    }

    function loadFormFromContract() {
        if (!currentContract) return;

        isLoading.value = true;

        try {
            let formLoaded = false;

            if (currentContract.viewForm) {
                if (currentContract.viewForm.settings) {
                    Object.assign(formSettings, currentContract.viewForm.settings);
                }

                if (currentContract.viewForm.components && Array.isArray(currentContract.viewForm.components)) {
                    components.value = currentContract.viewForm.components;

                    components.value.forEach(component => {
                        if (component.contractFieldId) {
                            const field = contractFields.value.find(f =>
                                f.propertyKey === component.contractFieldId);

                            if (field) {
                                component.readOnly = field.readOnly || false;
                            }
                        }

                        if (component.readOnly === undefined) {
                            component.readOnly = false;
                        }

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

                        if (component.gridSize === undefined) {
                            component.gridSize = 12;
                        }
                    });

                    nextId = Math.max(0, ...components.value.map(c => c.id || 0)) + 1;
                    formLoaded = true;
                }
            }

            if (isReadOnly.value && !formLoaded) {
                generateAutoForm();
            }

            if (isReadOnly.value) {
                previewMode.value = true;
                selectedComponent.value = null;
            }
        } catch (error) {
            console.error(error);
        } finally {
            isLoading.value = false;
        }
    }

    function moveComponentUp(id) {
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index > 0) {
            [components.value[index], components.value[index - 1]] =
                [components.value[index - 1], components.value[index]];
        }
    }

    function moveComponentDown(id) {
        if (isReadOnly.value) return;

        const index = components.value.findIndex(c => c.id === id);
        if (index >= 0 && index < components.value.length - 1) {
            [components.value[index], components.value[index + 1]] =
                [components.value[index + 1], components.value[index]];
        }
    }

    function handleComponentDragStart(event, component) {
        if (isReadOnly.value || previewMode.value) {
            event.preventDefault();
            return false;
        }

        event.stopPropagation();

        ui.draggedComponent = component;

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({ id: component.id }));

        const componentElement = event.target.closest('.mb-4.relative');
        if (componentElement) {
            ui.dropPreviewPosition = componentElement.offsetTop;
            ui.targetComponent = component;
            ui.dropPosition = 'before';
        }

        setTimeout(() => {
            event.target.classList.add('opacity-50');
        }, 0);
    }

    function handleComponentDragOver(event, targetComponent) {
        if (isReadOnly.value || previewMode.value || !ui.draggedComponent) return;

        if (ui.draggedComponent.id === targetComponent.id) {
            ui.dropPreviewPosition = -1000;
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        ui.targetComponent = targetComponent;

        const wrapper = event.target.closest('.mb-4.relative');
        if (!wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const mouseY = event.clientY - rect.top;
        const midPoint = rect.height / 2;

        if (mouseY < midPoint) {
            ui.dropPosition = 'before';
            ui.dropPreviewPosition = wrapper.offsetTop;
        } else {
            ui.dropPosition = 'after';
            ui.dropPreviewPosition = wrapper.offsetTop + wrapper.offsetHeight;
        }

        wrapper.classList.add('bg-blue-500/10');
    }

    function handleComponentDragLeave(event) {
        const wrapper = event.target.closest('.mb-4.relative');
        if (wrapper) {
            wrapper.classList.remove('bg-blue-500/10');
        }
    }

    function handleComponentDragEnd(event, component) {
        event.preventDefault();
        event.stopPropagation();

        const wrappers = document.querySelectorAll('.mb-4.relative');
        wrappers.forEach(wrapper => {
            wrapper.classList.remove('bg-blue-500/10', 'opacity-50');
        });

        if (ui.draggedComponent && ui.targetComponent && ui.draggedComponent.id !== ui.targetComponent.id) {
            const draggedIndex = components.value.findIndex(c => c.id === ui.draggedComponent.id);
            const targetIndex = components.value.findIndex(c => c.id === ui.targetComponent.id);

            if (draggedIndex >= 0 && targetIndex >= 0) {
                const updatedComponents = [...components.value];

                const [draggedComponent] = updatedComponents.splice(draggedIndex, 1);

                let insertPosition = targetIndex;
                if (draggedIndex < targetIndex) {
                    insertPosition--;
                }

                if (ui.dropPosition === 'before') {
                    updatedComponents.splice(insertPosition, 0, draggedComponent);
                } else {
                    updatedComponents.splice(insertPosition + 1, 0, draggedComponent);
                }

                components.value = updatedComponents;
            }
        }

        const componentType = event.dataTransfer.getData('componentType');
        if (componentType && ui.targetComponent) {
            const index = components.value.findIndex(c => c.id === ui.targetComponent.id);
            if (index !== -1) {
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

                if (componentType === 'select' || componentType === 'checkbox' || componentType === 'radio') {
                    newComponent.options = [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' }
                    ];
                }

                if (ui.dropPosition === 'before') {
                    components.value.splice(index, 0, newComponent);
                } else {
                    components.value.splice(index + 1, 0, newComponent);
                }
            }
        }

        ui.draggedComponent = null;
        ui.targetComponent = null;
        ui.dropPreviewPosition = 0;
        ui.dropPosition = 'before';
        isDragging.value = false;
        ui.isDraggingNewComponent = false;
    }

    function handleCanvasDrop(event) {
        if (isReadOnly.value || previewMode.value) return;

        event.preventDefault();
        event.stopPropagation();

        const componentType = event.dataTransfer.getData('componentType');
        if (componentType) {
            addComponent(componentType);
            isDragging.value = false;
            ui.isDraggingNewComponent = false;
            return;
        }

        if (!ui.draggedComponent) return;

        const draggedIndex = components.value.findIndex(c => c.id === ui.draggedComponent.id);

        if (draggedIndex < 0) return;

        const [draggedComponent] = components.value.splice(draggedIndex, 1);
        components.value.push(draggedComponent);

        ui.draggedComponent = null;
        ui.targetComponent = null;
        ui.dropPreviewPosition = 0;
        isDragging.value = false;
        ui.isDraggingNewComponent = false;
    }

    function initResize(event, component) {
        event.preventDefault();
        event.stopPropagation();

        if (previewMode.value || isReadOnly.value) return;

        const componentElement = event.target.closest('.grid-component');
        if (!componentElement) return;

        const startX = event.clientX;
        const startWidth = componentElement.getBoundingClientRect().width;
        const containerWidth = componentElement.parentElement.getBoundingClientRect().width;
        const startGridSize = component.gridSize;
        const columnWidth = containerWidth / 12;

        document.body.classList.add('resizing');
        componentElement.classList.add('resizing');

        selectComponent(component);

        component.isResizing = true;

        function handleMouseMove(e) {
            const dx = e.clientX - startX;
            const columnsChange = Math.round(dx / columnWidth);
            const newGridSize = Math.max(1, Math.min(12, startGridSize + columnsChange));

            component.gridSize = newGridSize;

            componentElement.style.gridColumn = `span ${newGridSize}`;
        }

        function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            document.body.classList.remove('resizing');
            componentElement.classList.remove('resizing');

            componentElement.style.gridColumn = '';

            component.isResizing = false;
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function setupResizeHandlers() {

    }

    function initializeResizing() {

    }

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