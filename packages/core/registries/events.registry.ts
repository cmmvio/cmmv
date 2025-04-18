export class EventsRegistry {
    public static events = new Map<string, { consumes: any[] }>();

    public static registerHandler(
        message: string,
        handlerName: string,
        callback: Function,
    ) {
        let events = this.events.get(message);

        if (!events) {
            this.events.set(message, {
                consumes: [],
            });

            events = this.events.get(message);
        }

        if (events) {
            const handler = events.consumes.find(
                (msg) => msg.handlerName === handlerName,
            );

            if (!handler) events.consumes.push({ handlerName, cb: callback });
            else handler.cb = callback;
        }
    }

    public static getEvents() {
        return Array.from(this.events.entries());
    }

    public static getConsumes(target: any): any[] {
        const events = this.events.get(target);
        return events ? events.consumes : [];
    }

    public static clear() {
        EventsRegistry.events = new Map<string, { consumes: any[] }>();
    }
}
