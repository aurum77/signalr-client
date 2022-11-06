import "./App.css";
import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";

function App() {
  const messageInputRef = useRef();
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("");
  const [clients, setClients] = useState([]);
  const [hubConnection, setHubConnection] = useState();

  useEffect(() => {
    createHubConnection();
  }, []);

  const createHubConnection = async () => {
    const hubConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/MyHub")
      .withAutomaticReconnect([1000, 2000, 5000, 10000])
      .build();

    try {
      await hubConnection.start();
      setStatus(`Connected to server with id ${hubConnection.connectionId}`);
      setHubConnection(hubConnection);
    } catch (e) {
      console.log("ERROR:", e);
    }

    hubConnection.onreconnecting(() => {
      setStatus("Trying to reconnect...");
    });

    hubConnection.onreconnected((connectionId) => {
      setStatus(`Reconnected to server with id ${connectionId}`);
    });

    hubConnection.onclose(() => {
      setStatus("Failed to reconnect");
    });

    hubConnection.on("ReceiveMessage", (incomingMessage) => {
      setMessages((messages) => [...messages, incomingMessage]);
    });

    hubConnection.on("UserJoined", (id) => {
      const msg = id + " has joined the chat";
      setLogs((log) => [...log, msg]);
    });

    hubConnection.on("UserLeft", (id) => {
      const msg = id + " has left the chat";
      setLogs((log) => [...log, msg]);
    });

    hubConnection.on("Clients", (clients) => {
      setClients(clients);
    });
  };

  const handleSendButtonClick = () => {
    let message = messageInputRef.current.value;
    hubConnection
      .invoke("SendMessage", message)
      .catch((err) => console.log(err));
  };

  return (
    <div className="container">
      <div className="child">
        <div>Status: {status}</div>
        <label>Message:</label>
        <input ref={messageInputRef} />
        <button onClick={handleSendButtonClick}>Send</button>
      </div>
      <div className="child">
        <label>
          Chat:
          {messages && messages.map((message) => <div>{message}</div>)}
        </label>
      </div>
      <div className="child">
        <label>
          Log:
          {logs && logs.map((log) => <div>{log}</div>)}
        </label>
      </div>
      <div className="child">
        <label>
          Clients:
          {clients && clients.map((client) => <div>{client}</div>)}
        </label>
      </div>
    </div>
  );
}

export default App;
