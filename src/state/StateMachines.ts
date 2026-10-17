export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

const CONNECTION_TRANSITIONS: Record<ConnectionState, readonly ConnectionState[]> = {
  disconnected: ['connecting'],
  connecting: ['connected', 'disconnected'],
  connected: ['disconnected'],
};

export type ActivityState = 'idle' | 'inLobby' | 'inGame';

const ACTIVITY_TRANSITIONS: Record<ActivityState, readonly ActivityState[]> = {
  idle: ['inLobby'],
  inLobby: ['idle', 'inGame'],
  inGame: ['inLobby'],
};

export class ConnectionMachine {
  private current: ConnectionState = 'disconnected';

  get state(): ConnectionState {
    return this.current;
  }

  canTransitionTo(next: ConnectionState): boolean {
    return CONNECTION_TRANSITIONS[this.current].includes(next);
  }

  transitionTo(next: ConnectionState): boolean {
    if (!this.canTransitionTo(next)) return false;
    this.current = next;
    return true;
  }
}

export class ActivityMachine {
  private current: ActivityState = 'idle';

  get state(): ActivityState {
    return this.current;
  }

  canTransitionTo(next: ActivityState): boolean {
    return ACTIVITY_TRANSITIONS[this.current].includes(next);
  }

  transitionTo(next: ActivityState): boolean {
    if (!this.canTransitionTo(next)) return false;
    this.current = next;
    return true;
  }
}