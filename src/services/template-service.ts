import { Liquid } from 'liquidjs';
import * as path from 'node:path';
import {Service} from "typedi";

import {TemplateFileSystem} from "./template-file-system";

// eslint-disable-next-line new-cap
@Service()
export class TemplateService {
    private liquidEngine: Liquid;

    constructor() {
        const currentDir = process.cwd();
        const fs = new TemplateFileSystem(currentDir);

        this.liquidEngine = new Liquid({
            extname: '.md.liquid',
            fs: {
                contains: fs.contains,
                dirname: fs.dirname,
                exists: fs.exists,
                existsSync: fs.existsSync,
                fallback: fs.fallback,
                readFile: fs.readFile,
                readFileSync: fs.readFileSync,
                resolve: fs.resolve,
                sep: fs.sep
            },
            root: [
                currentDir,
                path.join(currentDir, 'ai', 'prompts'),
            ]
        });
    }

    parseTemplate(template: string, vars: object): string {
        return this.liquidEngine.parseAndRenderSync(template, vars);
    }

    parseTemplateAsync(template: string, vars: object): Promise<string> {
        return this.liquidEngine.parseAndRender(template, vars);
    }

    parseTemplateFile(templateFile: string, vars: object): string {
        return this.liquidEngine.renderFileSync(templateFile, vars);
    }

    parseTemplateFileAsync(templateFile: string, vars: object): Promise<string> {
        return this.liquidEngine.renderFile(templateFile, vars);
    }
}