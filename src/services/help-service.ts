import {ux} from "@oclif/core";
import {Service} from "typedi";
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line new-cap
@Service()
export class HelpService {

    async displayNewProjectHelpMessage() {
        if (ux.action.running) {
            ux.action.stop();
        }

        console.log(ux.colorize('green', 'New mind-merge project structure created!'));
        console.log('Here are the new dirs that were created:');

        const tree = ux.tree()
        tree.insert('chats')
        tree.insert('prompts')
        tree.nodes.prompts.insert('agents')
        tree.nodes.prompts.insert('tools')
        tree.display()

        console.log(ux.colorize('green', 'You can now start creating your first agent and skill!'));
    }

    async findAiFoldersInNodeModules(dir: string, folderPath: string): Promise<string[]> {
        const aiPackages: string[] = [];
        function checkDir(directory: string) {
            const packages = fs.readdirSync(directory);
            for (const pkg of packages) {
                const packagePath = path.join(directory, pkg);
                if (fs.lstatSync(packagePath).isDirectory()) {
                    if (fs.existsSync(path.join(packagePath, 'ai'))) {
                        aiPackages.push(path.resolve(`${packagePath}/${folderPath}`));
                    }
                    checkDir(packagePath);
                }
            }
        }
        checkDir(dir);
        return aiPackages;
    }
}