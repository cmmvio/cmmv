export * from './decorators/controller.decorator';
export * from './registries/controller.registry';

export * from './adapters/default.adapter';
export * from './transpilers/default.transpiler';
export * from './lib/default.module';

export * from './lib/http.config';
export * from './lib/http.exception';
export * from './lib/http.schema';
export * from './lib/http.utils';
export * from './interfaces/http.interface';
export * from './services/http.service';

//View
import { ViewRegistry } from './registries/view.registry';

export * from './lib/view.renderview';
export * from './lib/view.template';
export * from './lib/view.directives';
export * from './lib/view.eval';
export * from './lib/view.utils';
export * from './lib/view.config';

export * from './transpilers/view.transpile';
export * from './registries/view.registry';

(async (_) => {
    await ViewRegistry.load();
})();
