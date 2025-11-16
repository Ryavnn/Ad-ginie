from flask import Flask, request, jsonify, send_from_directory
from flask.cli import load_dotenv
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps
import google.generativeai as genai
import PIL.Image


load_dotenv()

# Configure the Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file.")
genai.configure(api_key=api_key)

app = Flask(__name__)
CORS(app)


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
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

        # 2. Check for and handle the optional uploaded image
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename != '' and allowed_file(image_file.filename):
                # Secure the filename and save the file
                filename = secure_filename(image_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image_file.save(filepath)

                # Create the public-facing URL for the saved image
                # This assumes your Flask server is running on http://localhost:5000
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

        # 4. Call the Gemini API
        # We use 'gemini-1.5-flash' as it's fast and multimodal (handles text + image)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        if image_prompt_part:
            # Multimodal call (text + image)
            response = model.generate_content([prompt, image_prompt_part])
        else:
            # Text-only call
            response = model.generate_content(prompt)

        generated_caption = response.text.strip()

        # 5. Handle the image URL for the response
        if not image_url_for_response:
            # If no image was uploaded, provide a dynamic placeholder
            placeholder_text = style.replace(' ', '+') or 'AI+Ad'
            image_url_for_response = f"https://placehold.co/1080x1080/E0F2FE/0891B2?text={placeholder_text}"

        # 6. Send the successful response back to the React app
        return jsonify({
            'caption': generated_caption,
            'imageUrl': image_url_for_response
        })

    except Exception as e:
        print(f"Error: {e}") # Log the error to your console
        return jsonify({"message": f"An internal server error occurred: {e}"}), 500


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