import http, { Server } from 'http';
import https from 'https';

export class HttpServer {
  mProduction: boolean = false;
  mServer: Server | null = null;
  constructor({
    production,
    port,
    key = null,
    cert = null,
  }: {
    production: boolean;
    port: number;
    key?: any;
    cert?: any;
  }) {
    this.mProduction = production;

    if (this.mProduction && (!key || key === '' || !cert || cert === '')) {
      throw new Error(`'{key}' & '{cert}' are required parameter in production.`);
    } else {
      this.mServer = this.mProduction
        ? https.createServer({
            key,
            cert,
          })
        : http.createServer();

      this.mServer.listen(port);
    }
  }

  getServer() {
    return this.mServer;
  }
}
