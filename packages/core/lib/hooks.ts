import { Singleton } from '../abstracts';

type HookFunction = (...args: any[]) => void | Promise<void>;

export enum HooksType {
    'onPreInitialize',
    'onInitialize',
    'onListen',
    'onError',
    'onHTTPServerInit',
    'Log',
    'onSettingChange',
}

export class Hooks extends Singleton {
    private events: Map<HooksType, HookFunction[]> = new Map();

    public static add(event: HooksType, fn: HookFunction): void {
        const instance = Hooks.getInstance();

        if (!instance.events.has(event)) {
            instance.events.set(event, []);
        }

        instance.events.get(event)?.push(fn);
    }

    public static async execute(
        event: HooksType,
        ...args: any[]
    ): Promise<void> {
        const instance = Hooks.getInstance();
        const hooks = instance.events.get(event) || [];

        for (const fn of hooks) {
            await fn(...args);
        }
    }

    public static has(event: HooksType): boolean {
        const instance = Hooks.getInstance();
        return instance.events.has(event);
    }

    public static clear(event: HooksType): void {
        const instance = Hooks.getInstance();
        instance.events.delete(event);
    }

    public static remove(event: HooksType, fn: HookFunction): boolean {
        const instance = Hooks.getInstance();
        const hooks = instance.events.get(event);

        if (hooks) {
            const index = hooks.indexOf(fn);

            if (index > -1) {
                hooks.splice(index, 1);
                instance.events.set(event, hooks);
                return true;
            }
        }

        return false;
    }
}
