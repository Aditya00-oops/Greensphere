from pydantic import BaseModel
from typing import Optional

class WasteDetectionResponse(BaseModel):
    is_garbage: bool
    garbage_type: Optional[str] = None
    confidence: float
    accuracy: float
    message: str
