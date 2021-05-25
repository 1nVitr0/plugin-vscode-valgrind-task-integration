import { spawn, ChildProcess } from 'child_process';
import { Pseudoterminal, Disposable, Event, TerminalDimensions, EventEmitter } from 'vscode';
import { ValgrindTaskDefinition, ValgrindTaskType } from './AbstractValgrindTaskProvider';

export class ValgrindTaskTerminal implements Pseudoterminal {
  private taskType: ValgrindTaskType;
  private target: string;
  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<number>();
  private valgrind?: ChildProcess;
  private pidListener?: Disposable;

  public constructor(private definition: ValgrindTaskDefinition, private onPid?: (pid: string) => void) {
    this.taskType = <ValgrindTaskType>definition.type;
    this.target = definition.target;
  }

  private get valgrindArgs(): string[] {
    const args = ['--fullpath-after='];
    if (this.definition.valgrind) args.push(...this.definition.valgrind.args);
    if (this.taskType === ValgrindTaskType.debugTask) args.push('--vgdb-error=0');

    return args;
  }

  public onDidWrite: Event<string> = this.writeEmitter.event;
  public onDidClose?: Event<number> = this.closeEmitter.event;

  public open(initialDimensions: TerminalDimensions | undefined): void {
    this.writeEmitter.fire('Starting valgrind...\r\n');
    this.valgrind = spawn('valgrind', [...this.valgrindArgs, this.target]);
    this.valgrind.stdout?.on('data', this.forwardOutput.bind(this));
    this.valgrind.stderr?.on('data', this.forwardOutput.bind(this));
    this.valgrind.on('exit', () => this.closeEmitter.fire(0));

    if (this.onPid) this.catchPid().then(this.onPid);
  }

  public close(): void {
    this.valgrind?.kill();
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
