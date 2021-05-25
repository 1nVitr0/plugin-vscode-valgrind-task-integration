import { CustomExecution, ProcessExecution, ShellExecution } from 'vscode';
import { AbstractValgrindTaskProvider, ValgrindTaskDefinition, ValgrindTaskType } from './AbstractValgrindTaskProvider';
import { ValgrindTaskTerminal } from './ValgrindTaskTerminal';

export class ValgrindTaskProvider extends AbstractValgrindTaskProvider<ValgrindTaskType.task> {
  public readonly taskType: ValgrindTaskType.task = ValgrindTaskType.task;
  protected targets = { valgrind: '${command:cmake.launchTargetPath}' };

  protected getTaskExecution(): ProcessExecution | ShellExecution | CustomExecution {
    return new CustomExecution(async (definition) => new ValgrindTaskTerminal(<ValgrindTaskDefinition>definition));
  }
}
