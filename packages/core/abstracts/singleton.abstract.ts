export abstract class Singleton {
    private static instances: Map<string, Singleton> = new Map();

    public static getInstance<T extends Singleton>(this: new () => T): T {
        const className = this.name;

        let instance = Singleton.instances.get(className) as T | undefined;

        if (!instance) {
            try {
                instance = new this();
                Singleton.instances.set(className, instance);
            } catch (error) {
                throw new Error(
                    `Failed to create an instance of ${className}: ${error}`,
                );
            }
        }

        return instance;
    }

    public static clearInstance<T extends Singleton>(this: new () => T): void {
        const className = this.name;
        Singleton.instances.delete(className);
    }
}
