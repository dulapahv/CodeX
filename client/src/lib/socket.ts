import { BASE_SERVER_URL } from "./constants";

let ws: WebSocket | null = null;

/**
 * Returns a socket instance
 * @returns {Socket}
 */
export function webSocket() {
  if (!ws) {
    ws = new WebSocket(BASE_SERVER_URL);

    ws.addEventListener("message", (event) => {
      console.log(event.data);
    });
  }
  return ws;
}

export function send(msg: { type: string; data?: any }): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = webSocket();
    const serializedMsg = JSON.stringify(msg);

    const sendMessage = () => {
      try {
        ws.send(serializedMsg);
        ws.addEventListener("message", (event) => resolve(event.data), {
          once: true,
        });
      } catch (error) {
        reject(error);
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      sendMessage();
    } else if (ws.readyState === WebSocket.CONNECTING) {
      ws.addEventListener("open", sendMessage, { once: true });
    } else {
      reject(new Error("WebSocket is not open or connecting"));
    }
  });
}
