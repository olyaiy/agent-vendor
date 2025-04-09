import { generateText } from "ai";
import { myProvider } from "@/lib/models";
import { Message } from "ai";



export async function generateTitleFromUserMessage({
    message,
  }: {
    message: Message;
  }) {
    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });
  
    return title;
  }


