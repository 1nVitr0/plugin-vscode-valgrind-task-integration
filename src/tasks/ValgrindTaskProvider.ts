import { spawn } from 'child_process';
import { commands } from 'vscode';
import {
  CancellationToken,
  ProviderResult,
  Task,
  TaskDefinition,
  TaskProvider,
  TaskScope,
  Pseudoterminal,
  Event,
  TerminalDimensions,
  EventEmitter,
  CustomExecution,
  Disposable,
} from 'vscode';

interface ValgrindTaskDefinition extends TaskDefinition {
  /**
   * The build target Path
   */
  target: string;
  valgrind?: {
    args: string[];
  };
}

export enum ValgrindTaskType {
  task = 'valgrind',
  debugTask = 'valgrind-debug',
}

export class ValgrindTaskProvider implements TaskProvider {
  protected static defaultTargets = ['${command:cmake.launchTargetPath}'];

  private tasks: Task[] | undefined;
  private valgrindPids: { [key: string]: Promise<string | undefined> } = {};
  private pidListeners: { [key: string]: ((pid: string) => void)[] } = {};

  public provideTasks(token?: CancellationToken): ProviderResult<Task[]> {
    return this.getTasks();
  }

  public resolveTask(task: Task, token?: CancellationToken): ProviderResult<Task> {
    const { definition } = task;
    if (definition.target)
      return this.getTask(definition.target, <ValgrindTaskType>definition.type, <ValgrindTaskDefinition>definition);

    return undefined;
  }

  private async getTasks(): Promise<Task[]> {
    if (this.tasks) return this.tasks;

    this.tasks = [];
    for (const target of ValgrindTaskProvider.defaultTargets) {
      this.tasks.push(
        await this.getTask(target, ValgrindTaskType.task),
        await this.getTask(target, ValgrindTaskType.debugTask)
      );
    }

    return this.tasks;
  }

  public async getPid(target: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      if (this.valgrindPids[target]) resolve(this.valgrindPids[target]);
      else {
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

  private async getTask(
    _target: string,
    taskType: ValgrindTaskType,
    definition?: ValgrindTaskDefinition
  ): Promise<Task> {
    if (!definition) {
      definition = {
        type: taskType,
        target: _target,
      };
    }

    const command = /\$\{command:([^\}]+)\}/.exec(_target);
    if (command && command[1]) definition.target = (await commands.executeCommand(command[1])) || command[1];

    const { target } = definition;
    return new Task(
      definition,
      TaskScope.Workspace,
      `${taskType}: ${target}`,
      taskType,
      new CustomExecution(
        async (definition) =>
          new ValgrindTaskTerminal(
            taskType,
            target,
            <ValgrindTaskDefinition>definition,
            this.resolvePid.bind(this, target)
          )
      ),
      '$valgrind'
    );
  }

  private resolvePid(target: string, pid: string) {
    for (const listener of this.pidListeners[target] || []) listener(pid);
  }
}

export class ValgrindTaskTerminal implements Pseudoterminal {
  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<number>();
  private pidListener?: Disposable;

  public constructor(
    private taskType: ValgrindTaskType,
    private target: string,
    private definition: ValgrindTaskDefinition,
    private onPid: (pid: string) => void
  ) {}

  private get valgrindArgs(): string[] {
    const args = ['--fullpath-after='];
    if (this.definition.valgrind) args.push(...this.definition.valgrind.args);
    if (this.taskType == ValgrindTaskType.debugTask) args.push('--vgdb-error=0');

    return args;
  }

  public onDidWrite: Event<string> = this.writeEmitter.event;
  public onDidClose?: Event<number> = this.closeEmitter.event;

  public open(initialDimensions: TerminalDimensions | undefined): void {
    this.writeEmitter.fire('Starting valgrind...\r\n');
    const valgrind = spawn('valgrind', [...this.valgrindArgs, this.target]);
    valgrind.stdout.on('data', this.forwardOutput.bind(this));
    valgrind.stderr.on('data', this.forwardOutput.bind(this));
    valgrind.on('exit', () => this.closeEmitter.fire(0));

    this.catchPid().then(this.onPid);
  }

  public close(): void {
    this.pidListener?.dispose();
  }

  private catchPid(): Promise<string> {
    return new Promise((resolve) => {
      this.pidListener = this.onDidWrite((line) => {
        const pid = /^==(\d+)==/.exec(line);
        if (pid && pid[1]) {
          resolve(pid[1]);
          this.pidListener?.dispose();
        }
      });
    });
  }

  private forwardOutput(data: Buffer) {
    data
      .toString()
      .split(/\r?\n/)
      .forEach((line: string) => this.writeEmitter.fire(`${line}\r\n`));
  }
}
