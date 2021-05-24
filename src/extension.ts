import { ExtensionContext } from 'vscode';
import contributeCommands from './contribute/commands';
import contributeTasks from './contribute/tasks';
import { ValgrindTaskProvider } from './tasks/ValgrindTaskProvider';

export function activate(context: ExtensionContext) {
  const valgrindTaskProvider = new ValgrindTaskProvider();

  context.subscriptions.push(...contributeTasks(valgrindTaskProvider), ...contributeCommands(valgrindTaskProvider));
}
