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
                let prefSdp = CodecHandler.preferCodec(sdp, 'vp9');
                prefSdp = CodecHandler.setOpusAttributes(prefSdp, {
                    'useinbandfec': 1,
                    'stereo': 1,
                    'maxaveragebitrate': 510000
                });
                return prefSdp ? prefSdp : sdp
            },
            config: {
                iceServers: [
                    { 
                        urls: (process.env.REACT_APP_STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302').split(',') 
                    },
                    {
                        urls: (process.env.REACT_APP_TURN_SERVERS || '').split(',').filter(url => url),
                        username: process.env.REACT_APP_TURN_USERNAME || '',
                        credential: process.env.REACT_APP_TURN_CREDENCIAL || ''
                    },
                ].filter(server => server.urls.length > 0)
            }
        })
        return this.peer
    }
    connect = (otherId) => {
        this.peer.signal(otherId)
    }
} 
