from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the project root to sys.path so we can import from assets
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from assets.sentiment_model import analyze_sentiment_with_phrases
except ImportError:
    # Fallback if the path structure is different in production environment
    try:
        from sentiment_model import analyze_sentiment_with_phrases
    except ImportError:
        # If all else fails, we might be in a different context
        # But based on the local structure, the first one should work
        raise

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            text = data.get('text', '')
            star_rating = data.get('star_rating')
            
            # Convert star_rating to integer if it exists
            if star_rating is not None:
                try:
                    star_rating = int(star_rating)
                except (ValueError, TypeError):
                    star_rating = None
            
            if not text or len(text) < 10:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': 'Review text must be at least 10 characters long.'
                }).encode())
                return
            
            if len(text) > 1000:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': 'Review text cannot exceed 1000 characters.'
                }).encode())
                return
            
            # Using the model from assets/sentiment_model.py
            sentiment, details = analyze_sentiment_with_phrases(text, star_rating)
            
            result = {
                'success': True,
                'sentiment': sentiment,
                'details': details
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
