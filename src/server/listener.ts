import * as express from 'express'
export class Listener {
    private m_port: number = 8000;
    private m_hostname: string = "";
    private m_express_server: express.Express;

    constructor(express_server: express.Express) {
        this.m_express_server = express_server;
    }

    get port(): number {
        return this.m_port;
    }

    set port(port: number) {
        this.m_port = port;
    }

    get hostname(): string {
        return this.m_hostname;
    }

    set hostname(hostname: string) {
        this.m_hostname = hostname;
    }

    start(): void {
        const that = this;
        if (that.m_hostname) {
            that.m_express_server.listen(that.m_port, that.m_hostname, function() {
                console.log(`server is started ${that.m_port}!`);
            });
        } else {
            that.m_express_server.listen(that.m_port, function() {
                console.log(`server is started at ${that.m_port}!`);
            });
        }
    }
}