import 'reflect-metadata';
import {Args, Command, Flags} from '@oclif/core'
import {Container} from "typedi";

import {ProjectService} from "../../services/project-service";

export default class Start extends Command {
  static args = {}

  static description = 'Start dev-copilot start in the current directory'

  static examples = [
    `$ dev-copilot start`,
  ]

  static flags = {
  }

  async run(): Promise<void> {
    // const {args, flags} = await this.parse(StartService)

    const projectService = Container.get(ProjectService);
    projectService.initialize();

  }
}
