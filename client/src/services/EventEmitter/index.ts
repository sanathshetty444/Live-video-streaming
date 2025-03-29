export class EventEmitter {
    static events: Record<string, Function[]> = {};

    static emit(eventName: string, data: any) {
        if (!this.events[eventName]) return;

        this.events[eventName]?.forEach((callback) => callback(data));
    }

    static listen(eventName: string, callback: Function) {
        if (!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName].push(callback);
    }
}
