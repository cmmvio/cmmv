"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractHttpAdapter = void 0;
class AbstractHttpAdapter {
    constructor(instance) {
        this.instance = instance;
    }
    async init(application, settings) { }
    async use(...args) {
        return this.instance.use(...args);
    }
    get(...args) {
        return this.instance.get(...args);
    }
    post(...args) {
        return this.instance.post(...args);
    }
    head(...args) {
        return this.instance.head(...args);
    }
    delete(...args) {
        return this.instance.delete(...args);
    }
    put(...args) {
        return this.instance.put(...args);
    }
    patch(...args) {
        return this.instance.patch(...args);
    }
    all(...args) {
        return this.instance.all(...args);
    }
    search(...args) {
        return this.instance.search(...args);
    }
    options(...args) {
        return this.instance.options(...args);
    }
    listen(port, hostname, callback) {
        return this.instance.listen(port, hostname, callback);
    }
    getHttpServer() {
        return this.httpServer;
    }
    setHttpServer(httpServer) {
        this.httpServer = httpServer;
    }
    setInstance(instance) {
        this.instance = instance;
    }
    getInstance() {
        return this.instance;
    }
    setPublicDir(dirs) {
        const dirArr = typeof dirs === 'string' ? [dirs] : dirs;
        const currentViews = this.instance.get('views');
        if (Array.isArray(currentViews)) {
            const newList = [...currentViews, ...dirArr];
            this.instance.set('views', newList);
        }
    }
    isJson(result) {
        if (typeof result === 'object' && result !== null)
            return true;
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                return typeof parsed === 'object' && parsed !== null;
            }
            catch (e) {
                return false;
            }
        }
        return false;
    }
    close() {
        this.instance.close();
    }
}
exports.AbstractHttpAdapter = AbstractHttpAdapter;
