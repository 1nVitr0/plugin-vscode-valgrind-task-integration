import { commands } from 'vscode';
import { ValgrindTaskProvider } from '../tasks/ValgrindTaskProvider';
import { ValgrindCommandProvider } from '../commands/ValgrindCommandProvider';

export default function contributeCommands(valgrindTaskProvider: ValgrindTaskProvider) {
  const commandProvider = new ValgrindCommandProvider(valgrindTaskProvider);
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
