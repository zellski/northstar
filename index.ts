import indexHtml from "./src/index.html";
import chalk from 'chalk';

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": indexHtml,
    "/api/command": {
      POST: async (req) => {
        const body = await req.json();
        const { command } = body;
        console.log(`Received command: ${command}`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: `You entered: ${command}` 
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  },
  fetch(req, server) {
    // Handle WebSocket upgrade requests
    if (server.upgrade(req)) {
      return; // WebSocket connection handled
    }
    // Let routes handle everything else
    return new Response("Not found", { status: 404 });
  },
  // WebSocket support for real-time game updates
  websocket: {
    open: (ws) => {
      console.log("Player connected");
      ws.send(JSON.stringify({ 
        type: "welcome", 
        message: "Welcome to Northstar!" 
      }));
    },
    message: (ws, message) => {
      const data = JSON.parse(message.toString());
      console.log("Received:", data);
      
      // Echo the command first
      const commandEcho = chalk.yellow.bold(`▶ ${data.command}`);
      ws.send(JSON.stringify({
        type: "response", 
        message: commandEcho
      }));
      
      // Then process and respond
      let response = "";
      
      if (data.command === "help") {
        response = chalk.cyan.bold("Available commands:") + "\n" +
          chalk.green("  look") + chalk.gray(" - Look around") + "\n" +
          chalk.green("  inventory") + chalk.gray(" - Check your items") + "\n" +
          chalk.green("  say <message>") + chalk.gray(" - Say something") + "\n" +
          chalk.red("  quit") + chalk.gray(" - Leave the game");
      } else if (data.command === "look") {
        response = chalk.rgb(100, 150, 255)("You are in a ") + 
          chalk.rgb(50, 200, 50).bold("lush forest clearing") + 
          chalk.rgb(100, 150, 255)(". Sunlight filters through the ") +
          chalk.green("emerald canopy") + chalk.rgb(100, 150, 255)(" above.");
      } else {
        response = chalk.yellow(`You entered: ${data.command}`) + "\n" +
          chalk.gray("(Try ") + chalk.cyan("help") + chalk.gray(" for commands)");
      }
      
      ws.send(JSON.stringify({
        type: "response",
        message: response
      }));
    },
    close: (ws) => {
      console.log("Player disconnected");
    }
  },
  development: {
    hmr: true,
    console: true,
  }
});

console.log(`Server running on http://localhost:${server.port}`);