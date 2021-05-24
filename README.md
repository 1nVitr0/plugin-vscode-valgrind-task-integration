# Valgrind Task Integration

Integrate valgrind into the default tasks / launch.json workflow in vscode!

## Features

The extension provides commands and tasks that can be used to automate valgrind integration into your debugging workflow.
Unfortunately valgrind does not exactly fit the VSCode worklflow, but this extension tries it's best to make it fit.
The extension is not as fully featured as other cpp extensions (such as cmake tools), but basic valgrind support is implemented.

## Commands

This extension provides the following commands to be used in tasks and launch configs in the default format `${command:[COMMAND_NAME]}`:

`valgrind-task-integration.valgrindPid` runs valgrind in debugging mode and returns the process pid.

`valgrind-task-integration.valgrindGdbArg` runs valgrind in debugging mode and returns the arguments to be used in a gdb attach config.

## Tasks

`valgrind` is a task that runs valgrind in normal mode. It includes a problem matcher for valgrind errors.

`valgrind-debug` is a task that runs valgrind in debug mode. It includes a problem matcher for valgrind errors.

Both tasks support the following definition parameters:
  - `target`: path to the executable to debug
  - `valgrind`: valgrind options
    - `args`: arguments to be passed to valgrind

## Problem matchers

`valgrind` is a problem matcher that scans the default valgrind output.

## Examples

A basic example for a launch config in combination with the extension Cmake Tools:

```json
 {
      "name": "Launch Debugger with valgrind",
      "type": "cppdbg",
      "request": "launch",
      "program": "${command:cmake.launchTargetPath}",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${workspaceFolder}",
      "environment": [
        {
          "name": "PATH",
          "value": "$PATH:${command:cmake.launchTargetDirectory}"
        }
      ],
      "externalConsole": true,
      "MIMode": "gdb",
      "setupCommands": [
        {
          "description": "Enable pretty-printing for gdb",
          "text": "-enable-pretty-printing",
          "ignoreFailures": true
        },
        {
          "description": "Connect to valgrind",
          "text": "${command:valgrind-task-integration.valgrindGdbArg}",
          "ignoreFailures": true
        }
      ]
    }
```

## Known issues

- The problem matcher for valgrind seems to have issues when the first stacktrace file is not in your source directory.

