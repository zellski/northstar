import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export class SillyBot {
  private history: string[];

  constructor() {
    this.history = [];
  }

  async newMessage(msg: string): Promise<string> {
    this.history.push(msg);
    const { text } = await generateText({
      model: openai("o3-mini"),
      prompt: this.history.join("\n"),
    });
    this.history.push(text);
    return text;
  }
}
