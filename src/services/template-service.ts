import { Liquid } from 'liquidjs';
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class TemplateService {
    private liquidEngine: Liquid;

    constructor() {
        this.liquidEngine = new Liquid({
            extname: '.md.liquid',
            root: ['ai/prompts/', 'node_modules', 'node_modules/mind-merge-symfony/ai/prompts'] // FIXME: Fix this hardcoded hack to include all folders in node_modules that have ai in them
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