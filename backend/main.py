from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import math
from datetime import datetime, timedelta
import random

class TradingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/data':
            data = self.generate_data()
            self.wfile.write(json.dumps(data).encode())
    
    def generate_data(self):
        data = []
        base_price = 100
        num_points = 100
        last_close = base_price
        
        for i in range(num_points):
            time = (datetime.now() - timedelta(days=num_points-i)).strftime('%Y-%m-%d')
            volatility = 0.1
            
            change = last_close * volatility * (random.random() - 0.5)
            open_price = last_close
            close = open_price + change
            high = max(open_price, close) + abs(change) * random.random()
            low = min(open_price, close) - abs(change) * random.random()
            
            data.append({
                'time': time,
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(close, 2)
            })
            
            last_close = close
        
        return data

def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, TradingHandler)
    print('Starting server on port 8000...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
