export class MessageItem {
    sender: string;
    content: string;
    timestamp: Date;
}

export class Message {
    id: string
    messages: MessageItem[]
}
