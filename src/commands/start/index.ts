import {Command, Flags, ux} from '@oclif/core'
import 'reflect-metadata';
import {Container} from "typedi";
const fs = require('fs');
import {execSync} from 'node:child_process';

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

  async installWithYarn() {
    try {
      execSync('yarn add mind-merge-ai', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install mind-merge-ai package with Yarn.');
    }
  }

  async installWithNpm() {
    try {
      execSync('npm install mind-merge-ai', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install mind-merge-ai package with npm.');
    }
  }

  async handleInitWithoutPackageJson() {
    console.log('This project needs to be initialized with Yarn or npm.');

    // Check if Yarn is installed
    if (await this.isYarnInstalled()) {
      console.log('Running yarn init...');
      execSync('yarn init', { stdio: 'inherit' });
      this.installWithYarn();
    } else if (await this.isNpmInstalled()) {
      console.log('Running npm init...');
      execSync('npm init', { stdio: 'inherit' });
      this.installWithNpm();
    } else {
      console.error('Neither Yarn nor npm is installed. Please install one of them.');
    }
  }

  async isYarnInstalled() {
    try {
      execSync('yarn --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async isNpmInstalled() {
    try {
      execSync('npm --version');
      return true;
    } catch (error) {
      return false;
    }
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

    const projectDir = process.cwd();
    const packageJsonPath = `${projectDir}/package.json`;

    if (fs.existsSync(packageJsonPath)) {
      // Project is using Yarn or npm
      const isYarn = fs.existsSync(`${projectDir}/yarn.lock`);
      if (isYarn) {
        await this.installWithYarn();  
      } else {
        await this.installWithNpm();
      }
    } else {
      // Project doesn't have a package.json file
      await this.handleInitWithoutPackageJson();
    }

    await projectService.initialize();
  }
}
