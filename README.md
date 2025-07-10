Webrtc Peer 2 Peer 
Steps to Run Locally:

Install dependencies:

npm install  
Start the signaling server (using Socket.IO to exchange SDP payload):


node server/server.js  
Start the React app:


npm start  
Open http://localhost:3000/test in two different browser windows to initiate a peer connection.

Deploying to Public Server:

When hosting publicly, update the signaling server URL in video.js 

