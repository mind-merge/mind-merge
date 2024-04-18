import {Command, Flags, ux} from '@oclif/core'
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import 'reflect-metadata';
import {Container} from "typedi";

import {GlobalFlagsService} from "../../services/global-flags-service";
import {ProjectService} from "../../services/project-service";

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

  async handleInitWithoutPackageJson(packageName: string) {
    //This project needs to be initialized with Yarn or npm.

    // Check if Yarn is installed
    if (await this.isYarnInstalled()) {
      ux.log('Running yarn init...');
      execSync('yarn init', { stdio: 'inherit' });
      await this.installWithYarn(packageName);
    } else if (await this.isNpmInstalled()) {
      ux.log('Running npm init...');
      execSync('npm init', { stdio: 'inherit' });
      await this.installWithNpm(packageName);
    } else {
      console.error('Neither Yarn nor npm is installed. Please install one of them.');
    }
  }

  async installWithNpm(packageName: string) {
    try {
      execSync(`npm install ${packageName}`, { stdio: 'inherit' });
    } catch {
      console.error('Failed to install mind-merge-ai package with npm.');
    }
  }

  async installWithYarn(packageName: string) {
    try {
      execSync(`yarn add ${packageName}`, { stdio: 'inherit' });
    } catch {
      console.error('Failed to install mind-merge-ai package with Yarn.');
    }
  }

  async installYarnDependencies() {
    try {
      await execSync('yarn install');
      ux.log('Dependencies installed successfully.');
    } catch (error) {
      console.error(`Error installing dependencies: ${error}`);
    }
  }

  async installNpmDependencies() {
    try {
      await execSync('npm install');
      ux.log('Dependencies installed successfully.');
    } catch (error) {
      console.error(`Error installing dependencies: ${error}`);
    }
  }

  async isNpmInstalled() {
    try {
      execSync('npm --version');
      return true;
    } catch {
      return false;
    }
  }

  async isYarnInstalled() {
    try {
      execSync('yarn --version');
      return true;
    } catch {
      return false;
    }
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Start);

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
    ux.log("Project dir: ", ux.colorize('bgWhite', ux.colorize('blue', projectDir)));

    const packageName = 'mind-merge-ai';
    if (fs.existsSync(`${projectDir}/package.json`)) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      let isYarn = fs.existsSync(`${projectDir}/yarn.lock`);;
      if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        if (!fs.existsSync('node_modules')) {
          ux.log('node_modules directory does not exist. Installing dependencies...');
          // Project is using Yarn or npm
          await (isYarn ? this.installYarnDependencies() : this.installNpmDependencies());
        }
      } else {
        // Package is not listed in package.json, install it
        ux.log(`Installing ${packageName}...`);
        await (isYarn ? this.installWithYarn(packageName) : this.installWithNpm(packageName));
      }
    } else {
      // Project doesn't have a package.json file
      await this.handleInitWithoutPackageJson(packageName);
    }

    await projectService.initialize();
  }
}
