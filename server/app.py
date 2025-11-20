from flask import Flask, request, jsonify, send_from_directory
from flask.cli import load_dotenv
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps
import google.generativeai as genai
import PIL.Image


load_dotenv()

# Gemini API key is optional for local development. If not set, we will
# fall back to a lightweight local caption generator so the feature still works.
api_key = os.getenv("GEMINI_API_KEY")
USE_GEMINI = bool(api_key)
if USE_GEMINI:
    genai.configure(api_key=api_key)
else:
    print("GEMINI_API_KEY not found. Running in fallback/local mode.")

app = Flask(__name__)
CORS(app)


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adgenie.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


# SocialAccount model to store connected social accounts for a user
class SocialAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    provider = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(120), nullable=False)
    token = db.Column(db.String(500), nullable=True)
    connected = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'provider': self.provider,
            'username': self.username,
            'connected': self.connected,
            'created_at': self.created_at.isoformat()
        }

# Create tables
with app.app_context():
    db.create_all()

# JWT Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Routes

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not all([name, email, password]):
            return jsonify({'message': 'Name, email, and password are required'}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email.lower()).first()
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 409
        
        # Create new user
        new_user = User(
            name=name,
            email=email.lower()
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode(
            {
                'user_id': new_user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            },
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error during registration: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email.lower()).first()
        
        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            },
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error during login: {str(e)}'}), 500

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user profile (protected route)"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if 'name' in data:
            current_user.name = data['name']
        
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email'].lower()).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'message': 'Email already in use'}), 409
            current_user.email = data['email'].lower()
        
        if 'password' in data:
            if len(data['password']) < 6:
                return jsonify({'message': 'Password must be at least 6 characters long'}), 400
            current_user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating profile: {str(e)}'}), 500

@app.route('/api/user/delete', methods=['DELETE'])
@token_required
def delete_account(current_user):
    """Delete user account"""
    try:
        db.session.delete(current_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting account: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Ad Genie API is running'
    }), 200

def allowed_file(filename):
    """Checks if a filename has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_local_caption(description, style, tone, platforms, base_caption, image_provided):
    """A simple deterministic fallback caption generator for local dev.
    Keeps behavior reasonable when Gemini isn't available.
    """
    platform_note = ''
    if platforms:
        if len(platforms) == 1:
            platform_note = f" for {platforms[0].capitalize()}"
        else:
            platform_note = f" for {', '.join([p.capitalize() for p in platforms])}"

    image_note = ' Featuring product image.' if image_provided else ''

    # Keep caption concise and try to reflect style/tone
    style_part = f" [{style}]" if style else ''
    tone_part = f" ({tone})" if tone else ''

    base = base_caption.strip() if base_caption else ''
    if base:
        caption = f"{base} — refined{style_part}{tone_part}{platform_note}.{image_note}"
    else:
        # Generate a short caption from the description
        short_desc = description.strip()
        if len(short_desc) > 120:
            short_desc = short_desc[:117].rsplit(' ', 1)[0] + '...'
        caption = f"{short_desc}{style_part}{tone_part}{platform_note}.{image_note}"

    # Ensure the caption is a single line without excessive whitespace
    return ' '.join(caption.split())


def _try_generate_with_model(model_name, prompt, image_prompt_part):
    """Attempt to generate content using a specific Gemini model name.
    Returns the raw response object on success or raises the exception on failure.
    """
    # Using the specific stable version often resolves 404s
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    if image_prompt_part:
        return model.generate_content([prompt, image_prompt_part])
    return model.generate_content(prompt)


def generate_with_best_model(prompt, image_prompt_part):
    """Try a list of candidate Gemini models until one succeeds.
    If none succeed, raise the last exception.
    """
    # Common candidate model names to try. Order matters (preferred -> fallback).
    candidates = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5',
        'gemini-1.0',
    ]

    last_exc = None
    for name in candidates:
        try:
            print(f"Trying Gemini model: {name}")
            resp = _try_generate_with_model(name, prompt, image_prompt_part)
            return resp
        except Exception as e:
            # Model might not exist or not support this method; log and try next
            print(f"Model {name} failed: {e}")
            last_exc = e

    # If we reached here, none of the candidates worked
    raise last_exc if last_exc is not None else RuntimeError('No model candidates available')

# --- API Routes ---

@app.route('/api/generate-ad', methods=['POST'])
def generate_ad_route():
    """
    The main API endpoint to generate ad content.
    Receives form data and an optional image.
    """
    try:
        # 1. Get text data from the form
        description = request.form.get('description')
        style = request.form.get('style')
        tone = request.form.get('tone')
        base_caption = request.form.get('baseCaption', '')
        # 'getlist' is used to get all values for a key (for arrays)
        platforms = request.form.getlist('platforms[]')

        if not description:
            return jsonify({"message": "Ad description is required."}), 400

        image_file = None
        image_prompt_part = None
        image_url_for_response = None

 
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename != '' and allowed_file(image_file.filename):
                # Secure the filename and save the file
                filename = secure_filename(image_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image_file.save(filepath)

                image_url_for_response = f"http://localhost:5000/uploads/{filename}"
                
                # Prepare the image for the Gemini API
                img = PIL.Image.open(filepath)
                image_prompt_part = img
            
            elif image_file.filename != '':
                # Invalid file type
                return jsonify({"message": "Invalid file type. Allowed: png, jpg, jpeg, gif"}), 400

        # 3. Construct the prompt for Gemini
        platform_string = ", ".join(platforms) if platforms else "all major platforms"
        
        prompt = f"""
        You are an expert social media marketing copywriter.
        Your task is to generate a compelling ad caption.

        **Ad Details:**
        - **Product/Service Description:** {description}
        - **Desired Style:** {style}
        - **Desired Tone:** {tone}
        - **Target Platforms:** {platform_string}
        - **User's Base Caption (to refine, if any):** {base_caption or 'N/A'}

        **Instructions:**
        1. Analyze all the details provided.
        2. If an image is provided, generate a caption that is highly relevant to the image.
        3. If no image is provided, generate a caption based purely on the description.
        4. The caption should be engaging, clear, and perfectly match the requested style and tone.
        5. Return **only** the generated caption, with no extra text, labels, or formatting (like "Caption:" or quotes).
        """


        generated_caption = None

        # If GEMINI API key is available, try calling Gemini. If not,
        # or if any error occurs, fall back to a lightweight local caption generator.
        if USE_GEMINI:
            try:
                # Try to select a working model from known candidates
                response = generate_with_best_model(prompt, image_prompt_part)

                # Some SDK responses return text on .text or .response; be defensive.
                generated_caption = getattr(response, 'text', None) or getattr(response, 'response', None)
                if isinstance(generated_caption, (list, tuple)):
                    generated_caption = ' '.join(map(str, generated_caption))
                if generated_caption:
                    generated_caption = str(generated_caption).strip()

            except Exception as e:
                # Log error and fall back
                print(f"Gemini generation failed, falling back to local generator: {e}")
                generated_caption = None

        # Use fallback when needed
        if not generated_caption:
            generated_caption = generate_local_caption(
                description=description,
                style=style,
                tone=tone,
                platforms=platforms,
                base_caption=base_caption,
                image_provided=bool(image_prompt_part),
            )

        if not image_url_for_response:
            # Make placeholder text generation robust
            placeholder_text = (style or 'AI Ad').replace(' ', '+')
            image_url_for_response = f"https://placehold.co/1080x1080/E0F2FE/0891B2?text={placeholder_text}"

        return jsonify({
            'caption': generated_caption,
            'imageUrl': image_url_for_response
        })

    except Exception as e:
        print(f"Error: {e}") # Log the error to your console
        return jsonify({"message": f"An internal server error occurred: {e}"}), 500


# --- Social Accounts API ---
@app.route('/api/accounts', methods=['GET'])
@token_required
def list_accounts(current_user):
    """Return connected social accounts for the current user."""
    try:
        accounts = SocialAccount.query.filter_by(user_id=current_user.id).all()
        return jsonify({'accounts': [a.to_dict() for a in accounts]}), 200
    except Exception as e:
        return jsonify({'message': f'Error listing accounts: {e}'}), 500


@app.route('/api/accounts/connect', methods=['POST'])
@token_required
def connect_account(current_user):
    """Connect or update a social account for the user.
    This is a lightweight endpoint intended for demo/local use.
    Expected JSON: { provider, username, token (optional) }
    """
    try:
        data = request.get_json() or {}
        provider = (data.get('provider') or '').strip().lower()
        username = (data.get('username') or '').strip()
        token_val = data.get('token')

        if not provider or not username:
            return jsonify({'message': 'provider and username are required'}), 400

        # Check existing
        existing = SocialAccount.query.filter_by(user_id=current_user.id, provider=provider).first()
        if existing:
            existing.username = username
            if token_val:
                existing.token = token_val
            existing.connected = True
            db.session.commit()
            return jsonify({'message': 'Account updated', 'account': existing.to_dict()}), 200

        account = SocialAccount(
            user_id=current_user.id,
            provider=provider,
            username=username,
            token=token_val,
            connected=True
        )
        db.session.add(account)
        db.session.commit()
        return jsonify({'message': 'Account connected', 'account': account.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error connecting account: {e}'}), 500


@app.route('/api/accounts/<int:account_id>', methods=['DELETE'])
@token_required
def disconnect_account(current_user, account_id):
    """Disconnect (delete) a social account belonging to the current user."""
    try:
        account = SocialAccount.query.get(account_id)
        if not account or account.user_id != current_user.id:
            return jsonify({'message': 'Account not found'}), 404

        db.session.delete(account)
        db.session.commit()
        return jsonify({'message': 'Account disconnected'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error disconnecting account: {e}'}), 500


@app.route('/uploads/<path:filename>')
def send_uploaded_file(filename):
    """
    A separate route to serve the files from the 'uploads' directory.
    This allows the <img> tag in React to load the image.
    """
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)