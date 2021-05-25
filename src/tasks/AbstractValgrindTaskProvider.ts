import { commands, ProcessExecution, ShellExecution } from 'vscode';
import {
  CancellationToken,
  ProviderResult,
  Task,
  TaskDefinition,
  TaskProvider,
  TaskScope,
  CustomExecution,
} from 'vscode';

export interface ValgrindTaskDefinition extends TaskDefinition {
  target: string;
  valgrind?: {
    args: string[];
  };
}

export enum ValgrindTaskType {
  task = 'valgrind',
  debugTask = 'valgrind-debug',
}

export abstract class AbstractValgrindTaskProvider<T extends ValgrindTaskType> implements TaskProvider {
  public abstract readonly taskType: T;
  protected abstract targets: { [name: string]: string };
  protected tasks: Task[] | undefined;

  public provideTasks(token?: CancellationToken): ProviderResult<Task[]> {
    return this.getTasks();
  }

  public resolveTask(task: Task, token?: CancellationToken): ProviderResult<Task> {
    const { definition, name } = task;
    if (definition.target && definition.type === this.taskType)
      return this.getTask(definition.target, <T>definition.type, name, <ValgrindTaskDefinition>definition);

    return undefined;
  }

  protected abstract getTaskExecution(target: string): ProcessExecution | ShellExecution | CustomExecution;

  protected async getTasks(): Promise<Task[]> {
    if (this.tasks) return this.tasks;

    this.tasks = [];
    for (const name of Object.keys(this.targets)) {
      const target = this.targets[name];
      this.tasks.push(await this.getTask(this.targets[name], this.taskType, name));
    }

    return this.tasks;
  }

  protected async getTask(
    _target: string,
    taskType: ValgrindTaskType,
    name?: string,
    definition?: ValgrindTaskDefinition
  ): Promise<Task> {
    if (!definition) {
      definition = {
        type: taskType,
        target: _target,
      };
    }

    return new Task(
      definition,
      TaskScope.Workspace,
      name || `${taskType}: ${definition.target}`,
      taskType,
      this.getTaskExecution(definition.target),
      `$${this.taskType}`
    );
  }
}
