oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g dev-copilot
$ dev-copilot COMMAND
running command...
$ dev-copilot (--version)
dev-copilot/0.0.0 darwin-arm64 node-v21.6.1
$ dev-copilot --help [COMMAND]
USAGE
  $ dev-copilot COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`dev-copilot hello PERSON`](#dev-copilot-hello-person)
* [`dev-copilot hello world`](#dev-copilot-hello-world)
* [`dev-copilot help [COMMANDS]`](#dev-copilot-help-commands)
* [`dev-copilot plugins`](#dev-copilot-plugins)
* [`dev-copilot plugins:install PLUGIN...`](#dev-copilot-pluginsinstall-plugin)
* [`dev-copilot plugins:inspect PLUGIN...`](#dev-copilot-pluginsinspect-plugin)
* [`dev-copilot plugins:install PLUGIN...`](#dev-copilot-pluginsinstall-plugin-1)
* [`dev-copilot plugins:link PLUGIN`](#dev-copilot-pluginslink-plugin)
* [`dev-copilot plugins:uninstall PLUGIN...`](#dev-copilot-pluginsuninstall-plugin)
* [`dev-copilot plugins reset`](#dev-copilot-plugins-reset)
* [`dev-copilot plugins:uninstall PLUGIN...`](#dev-copilot-pluginsuninstall-plugin-1)
* [`dev-copilot plugins:uninstall PLUGIN...`](#dev-copilot-pluginsuninstall-plugin-2)
* [`dev-copilot plugins update`](#dev-copilot-plugins-update)

## `dev-copilot hello PERSON`

Say hello

```
USAGE
  $ dev-copilot hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/mincua/dev-copilot/blob/v0.0.0/src/commands/hello/index.ts)_

## `dev-copilot hello world`

Say hello world

```
USAGE
  $ dev-copilot hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ dev-copilot hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/mincua/dev-copilot/blob/v0.0.0/src/commands/hello/world.ts)_

## `dev-copilot help [COMMANDS]`

Display help for dev-copilot.

```
USAGE
  $ dev-copilot help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for dev-copilot.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.12/src/commands/help.ts)_

## `dev-copilot plugins`

List installed plugins.

```
USAGE
  $ dev-copilot plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ dev-copilot plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/index.ts)_

## `dev-copilot plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ dev-copilot plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ dev-copilot plugins add

EXAMPLES
  $ dev-copilot plugins add myplugin 

  $ dev-copilot plugins add https://github.com/someuser/someplugin

  $ dev-copilot plugins add someuser/someplugin
```

## `dev-copilot plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ dev-copilot plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ dev-copilot plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/inspect.ts)_

## `dev-copilot plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ dev-copilot plugins install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ dev-copilot plugins add

EXAMPLES
  $ dev-copilot plugins install myplugin 

  $ dev-copilot plugins install https://github.com/someuser/someplugin

  $ dev-copilot plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/install.ts)_

## `dev-copilot plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ dev-copilot plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ dev-copilot plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/link.ts)_

## `dev-copilot plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ dev-copilot plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ dev-copilot plugins unlink
  $ dev-copilot plugins remove

EXAMPLES
  $ dev-copilot plugins remove myplugin
```

## `dev-copilot plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ dev-copilot plugins reset
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/reset.ts)_

## `dev-copilot plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ dev-copilot plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ dev-copilot plugins unlink
  $ dev-copilot plugins remove

EXAMPLES
  $ dev-copilot plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/uninstall.ts)_

## `dev-copilot plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ dev-copilot plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ dev-copilot plugins unlink
  $ dev-copilot plugins remove

EXAMPLES
  $ dev-copilot plugins unlink myplugin
```

## `dev-copilot plugins update`

Update installed plugins.

```
USAGE
  $ dev-copilot plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/update.ts)_
<!-- commandsstop -->
