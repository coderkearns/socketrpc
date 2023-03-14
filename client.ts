type _PromiseMapEntry<ReturnT = any> = {
    resolve: (value: ReturnT | PromiseLike<ReturnT>) => void,
    reject: (reason?: any) => void
}

export default class SocketRPC {
    private _socket: WebSocket
    private _id: number
    private _promiseMap: Map<number, _PromiseMapEntry>
    public ready: Promise<void>
    private _setReady: (value: void) => void

    constructor(url: string) {
        this._socket = new WebSocket(url)
        this._id = 0
        this._promiseMap = new Map()

        this.ready = new Promise((resolve) => { this._setReady = resolve })
        this._initialize()
    }

    _initialize() {
        this._socket.onopen = () => {
            setInterval(() => this._setReady(), 1000)
        }

        this._socket.onmessage = (event) => {
            const { id, err, res } = JSON.parse(event.data)
            const promise = this._promiseMap.get(id)
            if (promise) {
                if (err) {
                    promise.reject(err)
                } else if (res) {
                    promise.resolve(res)
                }
            }
        }
    }

    call<ReturnT>(method: string, ...args: unknown[]): Promise<ReturnT> {
        const id = this._id++
        this._socket.send(JSON.stringify({ id, method, args }))
        return new Promise<ReturnT>((resolve, reject) => {
            this._promiseMap.set(id, { resolve, reject })
        })
    }
}
