import {Command, Flags, ux} from '@oclif/core'
import 'reflect-metadata';
import {Container} from "typedi";

import {ProjectService} from "../../services/project-service";
import {GlobalFlagsService} from "../../services/global-flags-service";

export default class Start extends Command {
  static args = {}

  static description = 'Start mind-merge listener in the current directory'

  static examples = [
    `$ mm start`,
  ]

  static flags = {
    maxToolCalls: Flags.integer({
        default: 5,
        description: 'Maximum number of tool calls to make',
        env: 'MM_MAX_TOOL_CALLS',
        required: false
    }),
    webstorm: Flags.boolean({
      default: false,
      description: 'Open chat files in webstorm after the answer finishes streaming',
      required: false
    }),
    webstormPath: Flags.string({
      dependsOn: ['webstorm'],
      description: 'Path to the webstorm executable',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Start)

    const projectService = Container.get(ProjectService);
    const globalFlagsService = Container.get(GlobalFlagsService);

    if (flags.webstorm) {
      ux.log(ux.colorize('green', 'Opening chat files in webstorm after the answer finishes streaming'));
      globalFlagsService.setFlag('webstorm', flags.webstorm);
      if (flags.webstormPath) {
        globalFlagsService.setFlag('webstormPath', flags.webstormPath);
      }
    }

    globalFlagsService.setFlag('maxToolCalls', flags.maxToolCalls);

    projectService.initialize();

  }
}
