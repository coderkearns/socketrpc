export type RPCProtocol = Record<string, (...args: any[]) => any>

export default class SocketRPCServer {
    private _port: number
    public protocol: RPCProtocol

    constructor(port: number, protocol: RPCProtocol) {
        this._port = port
        this.protocol = protocol
    }

    serve() {
        Bun.serve({
            fetch(req, server) {
                if (server.upgrade(req)) {
                    return
                }
                return new Response("Upgrade failed :(", { status: 500 })
            },
            websocket: {
                message: (ws, message) => {
                    const { id, method, args } = JSON.parse(message.toString())
                    if (!Object.keys(this.protocol).includes(method)) {
                        ws.send(JSON.stringify({ id, err: "undefined method" }))
                        return
                    }
                    try {
                        const result = this.protocol[method](...args)
                        ws.send(JSON.stringify({ id, res: result }))
                    } catch (e) {
                        ws.send(JSON.stringify({ id, err: String(e) }))
                    }
                }
            }
        })
    }
}
