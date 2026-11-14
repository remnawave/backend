"""Run the unmodified node agent and a TLS target inside the isolated lab."""
import json
import ssl
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from agent.meshagent import main
class Target(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.end_headers()
        self.wfile.write(json.dumps({'node': 'exit', 'ok': True}).encode())
    def log_message(self, *args): pass
server = HTTPServer(('0.0.0.0', 8443), Target)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('/state/cert.pem', '/state/tls.key')
server.socket = context.wrap_socket(server.socket, server_side=True)
threading.Thread(target=server.serve_forever, daemon=True).start()
main()
