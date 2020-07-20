import Peer from 'simple-peer'
import CodecHandler from './codec-handler'

export default class VideoCall {
    peer = null
    init = (stream, initiator) => {
        this.peer = new Peer({
            initiator: initiator,
            stream: stream,
            trickle: false,
            reconnectTimer: 1000,
            iceTransportPolicy: 'relay',
            sdpTransform: function (sdp) {
                let prefSdp = new CodecHandler().preferCodec(sdp, 'vp9');
                return prefSdp ? prefSdp : sdp
            },
            config: {
                iceServers: [
                    { urls: process.env.REACT_APP_STUN_SERVERS.split(',') },
                    {
                        urls: process.env.REACT_APP_TURN_SERVERS.split(','),
                        username: process.env.REACT_APP_TURN_USERNAME,
                        credential: process.env.REACT_APP_TURN_CREDENCIAL
                    },
                ]
            }
        })
        return this.peer
    }
    connect = (otherId) => {
        this.peer.signal(otherId)
    }
} 
