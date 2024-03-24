import {ux} from "@oclif/core";
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class GlobalFlagsService {

    private flags: Map<string, boolean | number | string> = new Map();

    getFlag(name: string): boolean | number | string | undefined {
        return this.flags.get(name);
    }

    listFlags() {
        ux.log('Global flags:');
        for (const [key, value] of this.flags) {
            ux.log(`${key}: ${value}`);
        }
    }

    removeFlag(name: string) {
        this.flags.delete(name);
    }

    setFlag(name: string, value: boolean | number | string) {
        this.flags.set(name, value);
    }

}