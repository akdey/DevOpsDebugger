from backend.app.main import app
from mangum import Mangum

# Convert ASGI FastAPI app to a serverless-compatible handler
handler = Mangum(app)
