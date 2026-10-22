from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path

class PreviewHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 8766), partial(PreviewHandler, directory=str(root)))
print('Game preview: http://127.0.0.1:8766/', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
