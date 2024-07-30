import { ux } from "@oclif/core";
import * as chokidar from 'chokidar';
import { Service } from "typedi";

type WatcherCallback = (filePath: string) => void;

interface WatcherConfig {
    directory: string;
    onAdd: WatcherCallback;
    onChange?: WatcherCallback;
    onReady?: () => void;
}

// eslint-disable-next-line new-cap
@Service()
export class WatcherService {
    private enableChangeListeners: boolean = true;
    private watchers: Map<string, chokidar.FSWatcher[]> = new Map();

    isWatcherRegistered(directory: string): boolean {
        return this.watchers.has(directory) && this.watchers.get(directory)!.length > 0;
    }

    registerWatcher(config: WatcherConfig): Promise<void> {
        const { directory, onAdd, onChange, onReady } = config;

        return new Promise((resolve) => {
            const watcher = chokidar.watch(directory, { persistent: true });

            watcher.on('add', onAdd);
            if (this.enableChangeListeners && onChange) {
                watcher.on('change', onChange);
            }

            // Register the watcher immediately
            if (!this.watchers.has(directory)) {
                this.watchers.set(directory, []);
            }

            this.watchers.get(directory)!.push(watcher);

            watcher.on('ready', () => {
                ux.log(ux.colorize('blue', `Registered watcher for: ${directory}`));
                if (onReady) {
                    onReady();
                }

                resolve();
            });
        });
    }

    setEnableChangeListeners(enable: boolean): void {
        this.enableChangeListeners = enable;
        ux.log(ux.colorize('blue', `Change listeners ${enable ? 'enabled' : 'disabled'}`));
    }

    async unregisterAllWatchers() {
        for (const [directory, watchers] of this.watchers) {
            for (const watcher of watchers)
                // eslint-disable-next-line no-await-in-loop
                await watcher.close();
            ux.log(ux.colorize('yellow', `Unregistered all watchers for: ${directory}`));
        }

        this.watchers.clear();
        ux.log(ux.colorize('green', 'All watchers unregistered'));
    }

    async unregisterWatcher(directory: string) {
        const watchers = this.watchers.get(directory);
        if (watchers) {
            for (const watcher of watchers)
                // eslint-disable-next-line no-await-in-loop
                await watcher.close();
            this.watchers.delete(directory);
            ux.log(ux.colorize('yellow', `Unregistered all watchers for: ${directory}`));
        }
    }
}