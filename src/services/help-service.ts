import {ux} from "@oclif/core";
import {Service} from "typedi";

// eslint-disable-next-line new-cap
@Service()
export class HelpService {

    displayNewProjectHelpMessage() {
        if (ux.action.running) {
            ux.action.stop();
        }

        console.log(ux.colorize('green', 'New dev-copilot project structure created!'));
        console.log('Here are the new dirs that were created:');

        const tree = ux.tree()
        tree.insert('chats')
        tree.insert('prompts')
        tree.nodes.prompts.insert('agents')
        tree.nodes.prompts.insert('skills')
        tree.display()

        console.log(ux.colorize('green', 'You can now start creating your first agent and skill!'));
    }

}