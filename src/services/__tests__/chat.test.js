// @flow
import ChatWebSocketService from 'services/chatWebSocket';
import ChatService from 'services/chat';
import { WebSocket, Server } from 'mock-socket';
import { SENTRY_DSN } from 'react-native-dotenv';
import { SignalClient } from 'rn-signal-protocol-messaging';


SignalClient.prepareApiBody = () => {
  return Promise.resolve(JSON.stringify({
    username: 'websocket1',
    message: 'hello there',
    userId: null,
    userConnectionAccessToken: null,
  }));
};

global.WebSocket = WebSocket;
global.SignalClient = SignalClient;

describe('chat service', () => {
  const fakeHost = 'wss://localhost:3292';
  const fakeURL = `${fakeHost}/v1/websocket/`;
  const client = SignalClient;
  let mockServer;
  let websocket;
  const credentials = {
    host: fakeHost,
    accessToken: 'uniqueAccessToken1',
    username: 'username1',
    fcmToken: 'fcmToken123',
    isSendingLogs: false,
    errorTrackingDSN: '',
  };
  const chat = new ChatService();

  const chatMock = {
    ...chat,
    init: jest.fn().mockImplementation(async (creds) => {
      websocket = new ChatWebSocketService(creds);
      creds.errorTrackingDSN = SENTRY_DSN;
      creds.isSendingLogs = false;
      return client.init(credentials);
    }),
    getWebSocketInstance: () => {
      return websocket;
    },
    sendMessage: chat.sendMessage,
    deleteMessage: chat.deleteMessage,
  };

  beforeEach(() => {
    mockServer = new Server(fakeURL);
  });

  afterEach(() => {
    websocket.stop();
    mockServer.stop();
  });

  it('Should successfully initialize chat service with websockets', async (done) => {
    mockServer.on('connection', socket => {
      expect(socket).toBeTruthy();
      done();
    });
    await chatMock.init(credentials)
      .then(() => chatMock.client.registerAccount())
      .then(() => chatMock.client.setFcmId(credentials.fcmToken))
      .catch(() => null);
    await websocket.listen();
  });

  it('Should successfully send a chat message to a target', async (done) => {
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        expect(data).toBeTruthy();
        if (data.toString().search('keepalive') === -1) {
          done();
        }
      });
    });
    await chatMock.init(credentials)
      .then(() => chatMock.client.registerAccount())
      .then(() => chatMock.client.setFcmId(credentials.fcmToken))
      .catch(() => null);

    await websocket.listen();

    chatMock.getWebSocketInstance = () => {
      return websocket;
    };

    const params = {
      username: 'targetUsername',
      userId: null,
      userConnectionAccessToken: null,
      message: 'Hello there',
    };
    await chatMock.sendMessage('chat', params, false);
  });
});
