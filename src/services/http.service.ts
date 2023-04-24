import http, { Server } from 'http';
import https from 'https';

export class HttpServer {
    M_production : boolean = false;
    M_server : Server | null = null;
    constructor({
        production,
        port,
        key = null,
        cert = null
    } : {
        production: boolean,
        port: number,
        key?: any,
        cert?: any
    }) {
        this.M_production = production;

        if (this.M_production && (!key || key == '' || !cert || cert == ''))
        {
            throw new Error(`'key' & 'cert' are required parameter in production.`);
        } else 
        {
            this.M_server = this.M_production ? https.createServer({
                key: key,
                cert: cert
            }) : http.createServer();

            this.M_server.listen(port, () => console.log(`server is listening on port :: ${port}✔`));
        }
    }

    getServer() { return this.M_server; }
}