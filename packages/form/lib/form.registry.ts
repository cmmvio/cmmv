import { FORM_ELEMENTS, FORM_NAMESPACE, FORM_OPTIONS } from './form.decorator';

export class FormRegistry {
    private static forms = new Map<string, any>();

    public static registerForm(namespace: string, formConstructor: any) {
        this.forms.set(namespace, formConstructor);
    }

    public static getForms() {
        let forms = {};
        let formsArr = [...this.forms.entries()];

        for (let key in formsArr) {
            const cls = formsArr[key][1];
            const namespace = Reflect.getMetadata(FORM_NAMESPACE, cls);
            const options = Reflect.getMetadata(FORM_OPTIONS, cls);
            const elements = Reflect.getMetadata(FORM_ELEMENTS, cls);

            forms[namespace] = {
                namespace,
                options,
                elements: [...elements],
            };
        }

        return forms;
    }
}
