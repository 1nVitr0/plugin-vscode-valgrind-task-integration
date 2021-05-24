import { tasks } from 'vscode';
import { ValgrindTaskProvider, ValgrindTaskType } from '../tasks/ValgrindTaskProvider';

export default function contributeTasks(valgrindTaskProvider: ValgrindTaskProvider) {
  return [
    tasks.registerTaskProvider(ValgrindTaskType.debugTask, valgrindTaskProvider),
    tasks.registerTaskProvider(ValgrindTaskType.task, valgrindTaskProvider),
  ];
}
