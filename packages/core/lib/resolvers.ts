import { Singleton } from '../abstracts';

type ResolverFunction = (...args: any[]) => void | Promise<void>;

export class Resolvers extends Singleton {
    private resolvers: Map<string, ResolverFunction> = new Map();

    public static add(namespace: string, fn: ResolverFunction): void {
        const instance = Resolvers.getInstance();
        instance.resolvers.set(namespace, fn);
    }

    public static async execute(
        namespace: string,
        ...args: any[]
    ): Promise<void> {
        const instance = Resolvers.getInstance();
        const resolvers = instance.resolvers.get(namespace) || null;

        if (resolvers) return await resolvers(...args);
    }

    public static has(namespace: string): boolean {
        const instance = Resolvers.getInstance();
        return instance.resolvers.has(namespace);
    }

    public static clear(namespace: string): void {
        const instance = Resolvers.getInstance();
        instance.resolvers.delete(namespace);
    }

    public static remove(namespace: string, fn: ResolverFunction): boolean {
        const instance = Resolvers.getInstance();
        return instance.resolvers.delete(namespace);
    }
}
