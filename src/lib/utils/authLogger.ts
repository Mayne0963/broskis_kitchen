type AuthEvent =
  | { type: 'state_change'; from?: string; to: string; detail?: any }
  | { type: 'request_start'; id: string; url: string; method?: string; at: number }
  | { type: 'request_end'; id: string; url: string; status: number; durationMs: number }
  | { type: 'token_refresh_start'; reason: string; concurrent?: number }
  | { type: 'token_refresh_end'; success: boolean; durationMs: number }
  | { type: 'error'; scope: string; message: string; detail?: any };

class AuthLogger {
  private static instance: AuthLogger;
  private enabled = true;
  private context: Record<string, any> = {};
  private lastRequestId = 0;

  static get(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setContext(ctx: Record<string, any>) {
    this.context = { ...this.context, ...ctx };
  }

  private log(evt: AuthEvent) {
    if (!this.enabled) return;
    const ts = new Date().toISOString();
    // Keep logging simple and non-blocking; can be extended to send to server
    // eslint-disable-next-line no-console
    console.info(`[AUTH][${ts}]`, { ...evt, context: this.context });
  }

  nextRequestId(): string {
    this.lastRequestId += 1;
    return `req_${this.lastRequestId}`;
  }

  stateChange(from: string | undefined, to: string, detail?: any) {
    this.log({ type: 'state_change', from, to, detail });
  }

  requestStart(id: string, url: string, method?: string) {
    this.log({ type: 'request_start', id, url, method, at: Date.now() });
  }

  requestEnd(id: string, url: string, status: number, startedAt: number) {
    this.log({ type: 'request_end', id, url, status, durationMs: Date.now() - startedAt });
  }

  refreshStart(reason: string, concurrent?: number) {
    this.log({ type: 'token_refresh_start', reason, concurrent });
  }

  refreshEnd(success: boolean, startedAt: number) {
    this.log({ type: 'token_refresh_end', success, durationMs: Date.now() - startedAt });
  }

  error(scope: string, message: string, detail?: any) {
    this.log({ type: 'error', scope, message, detail });
  }
}

export const authLogger = AuthLogger.get();