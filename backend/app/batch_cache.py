import time
import uuid
from typing import Any, Dict, Tuple

TTL_SECONDS = 30 * 60

class BatchCache:
    def __init__(self):
        self._store: Dict[str, Tuple[float, Dict[str, Any]]] = {}

    def put(self, payload: Dict[str, Any]) -> str:
        batch_id = str(uuid.uuid4())
        self._store[batch_id] = (time.time() + TTL_SECONDS, payload)
        self._gc()
        return batch_id

    def get(self, batch_id: str) -> Dict[str, Any] | None:
        item = self._store.get(batch_id)
        if not item:
            return None
        exp, data = item
        if exp < time.time():
            # expired
            self._store.pop(batch_id, None)
            return None
        return data

    def _gc(self):
        now = time.time()
        expired = [k for k, (exp, _) in self._store.items() if exp < now]
        for k in expired:
            self._store.pop(k, None)

CACHE = BatchCache()
