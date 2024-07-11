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
                let packagePath = path.join(directory, pkg);
                // check if packagePath is a link and follow it
                if (fs.lstatSync(packagePath).isSymbolicLink())
                    packagePath = fs.realpathSync(packagePath);
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