import { ValgrindTaskProvider, ValgrindTaskType } from '../tasks/ValgrindTaskProvider';
import { commands, Task, tasks, window } from 'vscode';

export class ValgrindCommandProvider {
  constructor(private taskProvider: ValgrindTaskProvider) {}

  public async valgrindPid(context?: string[], target?: string): Promise<string | undefined> {
    const task = await this.getValgrindTask(target);

    if (task) {
      tasks.executeTask(task);
      return await this.taskProvider.getPid(task.definition.target);
    }
  }

  public async valgrindGdbArg(context: string[], target?: string): Promise<string | undefined> {
    const pid = await this.valgrindPid();
    if (pid) return `target remote | /usr/bin/vgdb --pid=${pid}`;
  }

  private async getValgrindTask(target?: string): Promise<Task | undefined> {
    const taskList = await tasks.fetchTasks({ type: ValgrindTaskType.debugTask });

    if (!target) {
      if (taskList.length == 1) target = <string>taskList[0].definition.target;
      else {
        target = (
          await window.showQuickPick(
            taskList.map((task) => ({
              label: <string>task.definition.target,
            }))
          )
        )?.label;
      }
    }

    return taskList.find((task) => <string>task.definition.target == target);
  }
}
