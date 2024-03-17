import {Command} from '@oclif/core'
import 'reflect-metadata';
import {Container} from "typedi";

import {ProjectService} from "../../services/project-service";

export default class Start extends Command {
  static args = {}

  static description = 'Start mind-merge start in the current directory'

  static examples = [
    `$ mm start`,
  ]

  static flags = {
  }

  async run(): Promise<void> {
    // const {args, flags} = await this.parse(StartService)

    const projectService = Container.get(ProjectService);
    projectService.initialize();

  }
}
