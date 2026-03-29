from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, session_id: int):
        await websocket.accept()
        self.active[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: int):
        self.active[session_id].remove(websocket)

    async def broadcast(self, session_id: int, data: dict):
        for ws in self.active.get(session_id, []):
            await ws.send_json(data)

manager = ConnectionManager()
