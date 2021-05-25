import { tasks } from 'vscode';
import { ValgrindTaskProvider } from '../tasks/ValgrindTaskProvider';
import { ValgrindDebugTaskProvider } from '../tasks/ValgrindDebugTaskProvider';

export default function contributeTasks(
  valgrindTaskProvider: ValgrindTaskProvider,
  valgrindDebugTaskProvider: ValgrindDebugTaskProvider
) {
  return [
    tasks.registerTaskProvider(valgrindTaskProvider.taskType, valgrindTaskProvider),
    tasks.registerTaskProvider(valgrindDebugTaskProvider.taskType, valgrindDebugTaskProvider),
  ];
}
