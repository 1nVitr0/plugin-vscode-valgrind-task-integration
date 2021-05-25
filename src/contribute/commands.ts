import { commands } from 'vscode';
import { ValgrindCommandProvider } from '../commands/ValgrindCommandProvider';
import { ValgrindDebugTaskProvider } from '../tasks/ValgrindDebugTaskProvider';

export default function contributeCommands(valgrindDebugTaskProvider: ValgrindDebugTaskProvider) {
  const commandProvider = new ValgrindCommandProvider(valgrindDebugTaskProvider);
  return [
    commands.registerCommand(
      'valgrind-task-integration.valgrindPid',
      commandProvider.valgrindPid.bind(commandProvider)
    ),
    commands.registerCommand(
      'valgrind-task-integration.valgrindGdbArg',
      commandProvider.valgrindGdbArg.bind(commandProvider)
    ),
  ];
}
