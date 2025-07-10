import React from 'react';
import VideoCall from '../helpers/simple-peer';
import '../styles/video.css';
import io from 'socket.io-client';
import { getDisplayStream } from '../helpers/media-access';
import { ShareScreenIcon, MicOnIcon, MicOffIcon, CamOnIcon, CamOffIcon, DisconnectIcon } from './Icons';

class Video extends React.Component {
  constructor() {
    super();
    this.state = {
      localStream: {},
      displayStream: {},
      remoteStreamUrl: '',
      streamUrl: '',
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true,
      micState: true,
      camState: true,
      endCall: true
    };
  }
  videoCall = new VideoCall();

  componentDidMount() {
    //let server = "https://peerwebrtc.livevox.ngrok.io/";
    let server = "http://localhost:8080/";

    const socket = io(server);
    const component = this;
    this.setState({ socket });
    const { roomId } = this.props.match.params;
    console.log("Starting GetUser Media")
    this.getUserMedia().then(() => {
      console.log("Got the stream and trying to connect w server and join")
      socket.emit('join', { roomId: roomId });
    });

    socket.on('init', () => {
      component.setState({ initiator: true });
      console.log("Initiater ready and waiting for the peer", this.state.initiator)
    });
    socket.on('ready', () => {
      console.log("Enterting the Room")
      component.enter(roomId);
    });
    socket.on('desc', data => {
      if (data.type === 'offer' && component.state.initiator) return;
      if (data.type === 'answer' && !component.state.initiator) return;
      console.log("From Webserver: ", data)
      console.log("SDP From Server:", data.sdp)
      component.call(data);
    });
    socket.on('disconnected', () => {
      component.setState({ initiator: true });
    });
    socket.on('full', () => {
      component.setState({ full: true });
    });
  }


  async getUserMedia(cb) {

    const op = {
      video: {
        width: { min: 160, ideal: 1920, max: 4096 },
        height: { min: 120, ideal: 1080, max: 2160 }
      },
      audio: true
    };
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(op);
    } catch (err) {
      console.log(err);
    }
    this.setState({ streamUrl: stream, localStream: stream });
    this.localVideo.srcObject = stream;
  }

  disconnectCall() {
    this.setState({
      endCall: !this.state.endCall
    })
    this.state.localStream.getTracks().forEach(track => {
      track.stop();
    });
    this.state.peer.destroy();
  }

  setAudioLocal() {
    if (this.state.localStream.getAudioTracks().length > 0) {
      this.state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    this.setState({
      micState: !this.state.micState
    })
  }

  setVideoLocal() {
    if (this.state.localStream.getVideoTracks().length > 0) {
      this.state.localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    this.setState({
      camState: !this.state.camState
    })
  }

  getDisplay() {
    getDisplayStream().then(stream => {
      stream.oninactive = () => {
        this.localVideo.srcObject = this.state.localStream;
        this.state.peer.replaceTrack(stream.getTracks()[0], this.state.localStream.getVideoTracks()[0], this.state.localStream)
      };

      this.setState({ streamUrl: stream, displayStream: stream });
      this.localVideo.srcObject = stream;
      this.state.peer.replaceTrack(this.state.localStream.getVideoTracks()[0], stream.getTracks()[0], this.state.localStream)
    });
  }

  enter = roomId => {
    console.log("Entered Room");
    this.setState({ connecting: true });
    const peer = this.videoCall.init(
      this.state.localStream,
      this.state.initiator
    );
    this.setState({ peer });

    peer.on('signal', data => {
      console.log("To WebServer: ", data)
      console.log("SDP To Server: ", data.sdp)
      const signal = {
        room: roomId,
        desc: data
      };
      this.state.socket.emit('signal', signal);
    });
    peer.on('stream', stream => {
      console.log("Got the Remote Stream Audio and Video...")
      this.remoteVideo.srcObject = stream;
      this.setState({ connecting: false, waiting: false });
    });
    peer.on('error', function (err) {
      console.log(err);
    });
  };

  call = otherId => {
    this.videoCall.connect(otherId);
  };
  renderFull = () => {
    if (this.state.full) {
      return 'The room is full';
    }
  };
  render() {
    return (
      <div className='video-wrapper'>
        <div className='local-video-wrapper'>
          <video
            autoPlay
            id='localVideo'
            muted
            ref={video => (this.localVideo = video)}
          />
        </div>
        <video
          autoPlay
          className={`${
            this.state.connecting || this.state.waiting ? 'hide' : ''
            }`}
          id='remoteVideo'
          ref={video => (this.remoteVideo = video)}
        />

        <div className='controls'>
          <button
            className='control-btn'
            onClick={() => {
              this.getDisplay();
            }}
          >
            <ShareScreenIcon />
          </button>


          <button
            className='control-btn'
            onClick={() => {
              this.setAudioLocal();
            }}
          >
            {
              this.state.micState ? (
                <MicOnIcon />
              ) : (
                  <MicOffIcon />
                )
            }
          </button>

          <button
            className='control-btn'
            onClick={() => {
              this.setVideoLocal();
            }}
          >
            {
              this.state.camState ? (
                <CamOnIcon />
              ) : (
                  <CamOffIcon />
                )
            }
          </button>

          <button
            className='control-btn'
            onClick={() => {
              this.disconnectCall();
            }}
          >
            {
              this.state.endCall ? (
                <DisconnectIcon />
              ) : (
                  <DisconnectIcon />
                )
            }
          </button>
        </div>



        {this.state.connecting && (
          <div className='status'>
            <p>Establishing the connection...</p>
          </div>
        )}
        {this.state.waiting && (
          <div className='status'>
            <p>Waiting for someone...</p>
          </div>
        )}
        {this.renderFull()}
      </div>
    );
  }
}

export default Video;
