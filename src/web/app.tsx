import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import Ansi from "@curvenote/ansi-to-react";
import { Chalk } from "chalk";

const chalk = new Chalk({ level: 3 });

interface GameState {
  output: string[];
  isConnected: boolean;
  isLoggedIn: boolean;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    output: [
      chalk.rgb(100, 200, 255).bold("Welcome to Northstar!"),
      chalk.gray("Type ") +
        chalk.yellow("'help'") +
        chalk.gray(" for commands."),
    ],
    isConnected: false,
    isLoggedIn: false,
  });
  const [currentInput, setCurrentInput] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameState.isLoggedIn && !gameState.isConnected) {
      connectToGame();
    }
  }, [gameState.isLoggedIn]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [gameState.output]);

  const connectToGame = () => {
    console.log("Attempting WebSocket connection...");
    const ws = new WebSocket(`ws://localhost:3000`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected!");
      setGameState((prev) => ({ ...prev, isConnected: true }));
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
      const data = JSON.parse(event.data);
      if (data.type === "welcome" || data.type === "response") {
        setGameState((prev) => ({
          ...prev,
          output: [...prev.output, data.message],
        }));
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      setGameState((prev) => ({ ...prev, isConnected: false }));
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setGameState((prev) => ({
        ...prev,
        isLoggedIn: true,
        output: [...prev.output, `Logging in as ${username}...`],
      }));
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const command = currentInput.trim();

    // Send to WebSocket - let server handle echo and response
    if (wsRef.current && gameState.isConnected) {
      wsRef.current.send(JSON.stringify({ command }));
    } else {
      // Fallback when not connected
      const response = chalk.red("(not connected to server)");
      setGameState((prev) => ({
        ...prev,
        output: [...prev.output, response],
      }));
    }

    setCurrentInput("");
  };

  if (!gameState.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-600">
          <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">
            Northstar
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-green-300 mb-2">Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-gray-700 text-green-400 border border-gray-600 rounded focus:border-green-500 focus:outline-none"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-green-300 mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 text-green-400 border border-gray-600 rounded focus:border-green-500 focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition-colors"
            >
              Enter Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-400">Northstar</h1>
          <div className="flex items-center space-x-4">
            <span className="text-green-300">Player: {username}</span>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  gameState.isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                {gameState.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Game Output */}
        <div
          ref={outputRef}
          className="flex-1 bg-black border border-gray-600 rounded p-4 overflow-y-auto min-h-96 max-h-96"
        >
          {gameState.output.map((line, index) => (
            <div key={index} className="mb-1">
              <Ansi>{line}</Ansi>
            </div>
          ))}
        </div>

        {/* Command Input */}
        <form onSubmit={handleCommand} className="flex space-x-2">
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommand(e);
              }
            }}
            className="flex-1 p-3 bg-gray-800 text-green-400 border border-gray-600 rounded resize-none focus:border-green-500 focus:outline-none"
            placeholder="Enter command..."
            rows={1}
            style={{ minHeight: "3rem" }}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
