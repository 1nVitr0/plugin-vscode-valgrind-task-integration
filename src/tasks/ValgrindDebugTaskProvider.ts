import { commands, CustomExecution, ProcessExecution, ShellExecution, Task } from 'vscode';
import { ValgrindTaskDefinition, ValgrindTaskType, AbstractValgrindTaskProvider } from './AbstractValgrindTaskProvider';
import { ValgrindTaskTerminal } from './ValgrindTaskTerminal';

export class ValgrindDebugTaskProvider extends AbstractValgrindTaskProvider<ValgrindTaskType.debugTask> {
  public readonly taskType: ValgrindTaskType.debugTask = ValgrindTaskType.debugTask;
  protected targets = { 'valgrind-debug': '${command:cmake.launchTargetPath}' };
  private valgrindPids: { [key: string]: Promise<string | undefined> } = {};
  private pidListeners: { [key: string]: ((pid: string) => void)[] } = {};

  public async getPid(target: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      if (this.valgrindPids[target]) {
        resolve(this.valgrindPids[target]);
      } else {
        const resolvePid = (pid: string) => {
          const index = this.pidListeners[target].indexOf(resolvePid);
          if (index >= 0) this.pidListeners[target].splice(index, 1);
          resolve(pid);
        };
        if (!this.pidListeners[target]) this.pidListeners[target] = [];
        this.pidListeners[target].push(resolvePid);
      }
    });
  }

  protected getTaskExecution(target: string): ProcessExecution | ShellExecution | CustomExecution {
    return new CustomExecution(async (definition) => {
      const command = /\$\{command:([^\}]+)\}/.exec(definition.target);
      if (command && command[1]) definition.target = (await commands.executeCommand(command[1])) || definition.target;
      return new ValgrindTaskTerminal(<ValgrindTaskDefinition>definition, this.resolvePid.bind(this, target));
    });
  }

  private resolvePid(target: string, pid: string) {
    for (const listener of this.pidListeners[target] || []) listener(pid);
  }
}
