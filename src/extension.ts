import { ExtensionContext } from 'vscode';
import contributeCommands from './contribute/commands';
import contributeTasks from './contribute/tasks';
import { ValgrindTaskProvider } from './tasks/ValgrindTaskProvider';
import { ValgrindDebugTaskProvider } from './tasks/ValgrindDebugTaskProvider';

export function activate(context: ExtensionContext) {
  const valgrindTaskProvider = new ValgrindTaskProvider();
  const valgrindDebugTaskProvider = new ValgrindDebugTaskProvider();

  context.subscriptions.push(
    ...contributeTasks(valgrindTaskProvider, valgrindDebugTaskProvider),
    ...contributeCommands(valgrindDebugTaskProvider)
  );
}
