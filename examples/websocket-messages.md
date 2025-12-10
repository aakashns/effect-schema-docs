---
title: WebSocket Messages
description: Build type-safe real-time protocols with Effect Schema
---

# WebSocket Messages

This example demonstrates how to create type-safe bidirectional communication protocols for WebSocket applications, including message validation, error handling, and pattern matching.

## The Problem

Real-time applications need:
- Type-safe message definitions
- Validation of incoming messages
- Serialization of outgoing messages
- Clear protocol documentation
- Exhaustive handling of message types

Effect Schema makes this easy with discriminated unions and JSON parsing.

## Defining Message Types

Use `TaggedStruct` for clean discriminated unions:

```typescript
import { Schema } from "effect"

// ================================
// Client → Server Messages
// ================================

const JoinRoom = Schema.TaggedStruct("JoinRoom", {
  roomId: Schema.String.pipe(Schema.nonEmptyString())
})

const LeaveRoom = Schema.TaggedStruct("LeaveRoom", {
  roomId: Schema.String
})

const SendMessage = Schema.TaggedStruct("SendMessage", {
  roomId: Schema.String,
  content: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Message cannot be empty" }),
    Schema.maxLength(1000, { message: () => "Message too long (max 1000 chars)" })
  )
})

const StartTyping = Schema.TaggedStruct("StartTyping", {
  roomId: Schema.String
})

const StopTyping = Schema.TaggedStruct("StopTyping", {
  roomId: Schema.String
})

// Union of all client messages
const ClientMessage = Schema.Union(
  JoinRoom,
  LeaveRoom,
  SendMessage,
  StartTyping,
  StopTyping
)

type ClientMessage = typeof ClientMessage.Type
```

## Server Messages

```typescript
// ================================
// Server → Client Messages
// ================================

const RoomJoined = Schema.TaggedStruct("RoomJoined", {
  roomId: Schema.String,
  users: Schema.Array(Schema.Struct({
    userId: Schema.String,
    username: Schema.String,
    isOnline: Schema.Boolean
  })),
  recentMessages: Schema.Array(Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    content: Schema.String,
    timestamp: Schema.DateFromString
  }))
})

const UserJoined = Schema.TaggedStruct("UserJoined", {
  roomId: Schema.String,
  userId: Schema.String,
  username: Schema.String
})

const UserLeft = Schema.TaggedStruct("UserLeft", {
  roomId: Schema.String,
  userId: Schema.String
})

const NewMessage = Schema.TaggedStruct("NewMessage", {
  roomId: Schema.String,
  messageId: Schema.String,
  userId: Schema.String,
  username: Schema.String,
  content: Schema.String,
  timestamp: Schema.DateFromString
})

const UserTyping = Schema.TaggedStruct("UserTyping", {
  roomId: Schema.String,
  userId: Schema.String,
  username: Schema.String,
  isTyping: Schema.Boolean
})

const ErrorMessage = Schema.TaggedStruct("Error", {
  code: Schema.Literal(
    "INVALID_MESSAGE",
    "ROOM_NOT_FOUND",
    "NOT_AUTHORIZED",
    "RATE_LIMITED"
  ),
  message: Schema.String
})

const ServerMessage = Schema.Union(
  RoomJoined,
  UserJoined,
  UserLeft,
  NewMessage,
  UserTyping,
  ErrorMessage
)

type ServerMessage = typeof ServerMessage.Type
```

## JSON Parsing Schemas

Create schemas that parse JSON strings directly:

```typescript
// Parse JSON string into ClientMessage
const ClientMessageFromJson = Schema.parseJson(ClientMessage)

// Encode ServerMessage to JSON string
const ServerMessageToJson = Schema.parseJson(ServerMessage)
```

## Server-Side Handler

Handle incoming WebSocket messages on the server:

```typescript
import { Schema, Either } from "effect"

class WebSocketHandler {
  private rooms = new Map<string, Set<WebSocket>>()
  
  handleConnection(ws: WebSocket, userId: string) {
    ws.onmessage = (event) => {
      this.handleMessage(ws, userId, event.data)
    }
    
    ws.onclose = () => {
      this.handleDisconnect(ws, userId)
    }
  }
  
  private handleMessage(ws: WebSocket, userId: string, data: string) {
    // Parse and validate the incoming message
    const result = Schema.decodeUnknownEither(ClientMessageFromJson)(data)
    
    if (Either.isLeft(result)) {
      this.sendError(ws, "INVALID_MESSAGE", "Could not parse message")
      return
    }
    
    const message = result.right
    
    // Handle each message type
    switch (message._tag) {
      case "JoinRoom":
        this.handleJoinRoom(ws, userId, message.roomId)
        break
        
      case "LeaveRoom":
        this.handleLeaveRoom(ws, userId, message.roomId)
        break
        
      case "SendMessage":
        this.handleSendMessage(ws, userId, message.roomId, message.content)
        break
        
      case "StartTyping":
        this.broadcastTyping(userId, message.roomId, true)
        break
        
      case "StopTyping":
        this.broadcastTyping(userId, message.roomId, false)
        break
    }
  }
  
  private handleJoinRoom(ws: WebSocket, userId: string, roomId: string) {
    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set())
    }
    this.rooms.get(roomId)!.add(ws)
    
    // Send room info to the joining user
    const response: typeof RoomJoined.Type = {
      _tag: "RoomJoined",
      roomId,
      users: [], // Load from database
      recentMessages: [] // Load from database
    }
    
    this.send(ws, response)
    
    // Notify others in the room
    this.broadcastToRoom(roomId, {
      _tag: "UserJoined",
      roomId,
      userId,
      username: "User" // Load from database
    }, ws)
  }
  
  private handleSendMessage(
    ws: WebSocket, 
    userId: string, 
    roomId: string, 
    content: string
  ) {
    const message: typeof NewMessage.Type = {
      _tag: "NewMessage",
      roomId,
      messageId: crypto.randomUUID(),
      userId,
      username: "User", // Load from database
      content,
      timestamp: new Date()
    }
    
    // Broadcast to all in room including sender
    this.broadcastToRoom(roomId, message)
  }
  
  private send(ws: WebSocket, message: ServerMessage) {
    // Encode the message to JSON
    const json = JSON.stringify(Schema.encodeSync(ServerMessage)(message))
    ws.send(json)
  }
  
  private sendError(
    ws: WebSocket, 
    code: typeof ErrorMessage.Type["code"], 
    message: string
  ) {
    this.send(ws, { _tag: "Error", code, message })
  }
  
  private broadcastToRoom(
    roomId: string, 
    message: ServerMessage, 
    exclude?: WebSocket
  ) {
    const room = this.rooms.get(roomId)
    if (!room) return
    
    for (const ws of room) {
      if (ws !== exclude) {
        this.send(ws, message)
      }
    }
  }
}
```

## Client-Side Handler

Handle messages on the client:

```typescript
class ChatClient {
  private ws: WebSocket
  private handlers = new Map<string, (message: any) => void>()
  
  constructor(url: string) {
    this.ws = new WebSocket(url)
    
    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }
  }
  
  private handleMessage(data: string) {
    const result = Schema.decodeUnknownEither(
      Schema.parseJson(ServerMessage)
    )(data)
    
    if (Either.isLeft(result)) {
      console.error("Invalid server message:", result.left)
      return
    }
    
    const message = result.right
    
    switch (message._tag) {
      case "RoomJoined":
        this.onRoomJoined(message)
        break
        
      case "UserJoined":
        this.onUserJoined(message)
        break
        
      case "UserLeft":
        this.onUserLeft(message)
        break
        
      case "NewMessage":
        this.onNewMessage(message)
        break
        
      case "UserTyping":
        this.onUserTyping(message)
        break
        
      case "Error":
        this.onError(message)
        break
    }
  }
  
  // Public API
  joinRoom(roomId: string) {
    this.send({ _tag: "JoinRoom", roomId })
  }
  
  leaveRoom(roomId: string) {
    this.send({ _tag: "LeaveRoom", roomId })
  }
  
  sendMessage(roomId: string, content: string) {
    this.send({ _tag: "SendMessage", roomId, content })
  }
  
  startTyping(roomId: string) {
    this.send({ _tag: "StartTyping", roomId })
  }
  
  stopTyping(roomId: string) {
    this.send({ _tag: "StopTyping", roomId })
  }
  
  private send(message: ClientMessage) {
    const json = JSON.stringify(Schema.encodeSync(ClientMessage)(message))
    this.ws.send(json)
  }
  
  // Override these in your app
  protected onRoomJoined(message: typeof RoomJoined.Type) {}
  protected onUserJoined(message: typeof UserJoined.Type) {}
  protected onUserLeft(message: typeof UserLeft.Type) {}
  protected onNewMessage(message: typeof NewMessage.Type) {}
  protected onUserTyping(message: typeof UserTyping.Type) {}
  protected onError(message: typeof ErrorMessage.Type) {}
}
```

## React Hook Example

Use the client in React:

```typescript
function useChat(roomId: string) {
  const [messages, setMessages] = useState<typeof NewMessage.Type[]>([])
  const [users, setUsers] = useState<{ userId: string; username: string }[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const clientRef = useRef<ChatClient | null>(null)
  
  useEffect(() => {
    const client = new (class extends ChatClient {
      protected onRoomJoined(msg: typeof RoomJoined.Type) {
        setUsers(msg.users)
        setMessages(msg.recentMessages.map(m => ({
          ...m,
          _tag: "NewMessage" as const,
          username: "" // Fill from users
        })))
      }
      
      protected onNewMessage(msg: typeof NewMessage.Type) {
        setMessages(prev => [...prev, msg])
      }
      
      protected onUserJoined(msg: typeof UserJoined.Type) {
        setUsers(prev => [...prev, { userId: msg.userId, username: msg.username }])
      }
      
      protected onUserLeft(msg: typeof UserLeft.Type) {
        setUsers(prev => prev.filter(u => u.userId !== msg.userId))
      }
      
      protected onUserTyping(msg: typeof UserTyping.Type) {
        setTypingUsers(prev => {
          const next = new Set(prev)
          if (msg.isTyping) {
            next.add(msg.userId)
          } else {
            next.delete(msg.userId)
          }
          return next
        })
      }
    })("wss://api.example.com/ws")
    
    clientRef.current = client
    client.joinRoom(roomId)
    
    return () => {
      client.leaveRoom(roomId)
    }
  }, [roomId])
  
  return {
    messages,
    users,
    typingUsers,
    sendMessage: (content: string) => clientRef.current?.sendMessage(roomId, content),
    startTyping: () => clientRef.current?.startTyping(roomId),
    stopTyping: () => clientRef.current?.stopTyping(roomId)
  }
}
```

## Key Takeaways

1. **TaggedStruct** creates clean discriminated unions with `_tag` field
2. **parseJson** handles JSON parsing and validation in one step
3. **Exhaustive matching** ensures all message types are handled
4. **Bidirectional** - same schemas for parsing and serialization
5. **Type safety** flows from schema definition to all handlers

## Next Steps

- [API Validation](/examples/api-validation) - REST API patterns
- [Unions](/guide/unions) - More on discriminated unions
- [Transformations](/guide/transformations) - Custom transformations
