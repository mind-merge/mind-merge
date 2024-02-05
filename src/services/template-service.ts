import { Liquid } from 'liquidjs';
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class TemplateService {
    private liquidEngine: Liquid;

    constructor() {
        this.liquidEngine = new Liquid({
            extname: '.md',
            root: ['prompts/']
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