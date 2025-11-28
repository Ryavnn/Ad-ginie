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
import requests
import base64
from urllib.parse import urlencode


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

# Ad model to store generated ads
class Ad(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    caption = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    platforms = db.Column(db.String(500), nullable=False)  # comma-separated or JSON
    status = db.Column(db.String(50), default='Draft')  # Draft, Scheduled, Posted
    impressions = db.Column(db.Integer, default=0)
    engagement = db.Column(db.Integer, default=0)
    scheduled_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'caption': self.caption,
            'image_url': self.image_url,
            'platforms': self.platforms.split(',') if self.platforms else [],
            'status': self.status,
            'impressions': self.impressions,
            'engagement': self.engagement,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'created_at': self.created_at.isoformat(),
            'published_at': self.published_at.isoformat() if self.published_at else None
        }

# Activity model to track user actions
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # post, schedule, account, draft, etc
    message = db.Column(db.String(255), nullable=False)
    icon_type = db.Column(db.String(50), nullable=True)  # instagram, calendar, link2, file-text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'message': self.message,
            'icon_type': self.icon_type,
            'created_at': self.created_at.isoformat()
        }

# Analytics model to store performance data
class Analytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    ad_id = db.Column(db.Integer, db.ForeignKey('ad.id'), nullable=True)
    platform = db.Column(db.String(50), nullable=False)
    impressions = db.Column(db.Integer, default=0)
    engagement = db.Column(db.Integer, default=0)
    ctr = db.Column(db.Float, default=0.0)  # Click-through rate
    growth = db.Column(db.String(50), default='+0%')
    date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ad_id': self.ad_id,
            'platform': self.platform,
            'impressions': self.impressions,
            'engagement': self.engagement,
            'ctr': self.ctr,
            'growth': self.growth,
            'date': self.date.isoformat()
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
            # Use the Session.get() API to avoid SQLAlchemy Query.get() legacy warning
            current_user = db.session.get(User, data['user_id'])
            
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

# --- Ads API ---
@app.route('/api/ads', methods=['GET'])
@token_required
def list_ads(current_user):
    """Get all ads for the current user"""
    try:
        ads = Ad.query.filter_by(user_id=current_user.id).order_by(Ad.created_at.desc()).all()
        return jsonify({'ads': [ad.to_dict() for ad in ads]}), 200
    except Exception as e:
        return jsonify({'message': f'Error listing ads: {e}'}), 500

@app.route('/api/ads', methods=['POST'])
@token_required
def create_ad(current_user):
    """Create a new ad"""
    try:
        data = request.get_json()
        
        title = data.get('title', 'Untitled Ad')
        caption = data.get('caption', '')
        image_url = data.get('image_url')
        platforms = data.get('platforms', [])
        status = data.get('status', 'Draft')
        
        ad = Ad(
            user_id=current_user.id,
            title=title,
            caption=caption,
            image_url=image_url,
            platforms=','.join(platforms) if platforms else '',
            status=status
        )
        
        db.session.add(ad)
        db.session.commit()
        
        # Log activity
        activity = Activity(
            user_id=current_user.id,
            type='draft',
            message=f'Created new ad "{title}"',
            icon_type='file-text'
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'Ad created', 'ad': ad.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating ad: {e}'}), 500

@app.route('/api/ads/<int:ad_id>', methods=['GET'])
@token_required
def get_ad(current_user, ad_id):
    """Get a specific ad"""
    try:
        ad = db.session.get(Ad, ad_id)
        if not ad or ad.user_id != current_user.id:
            return jsonify({'message': 'Ad not found'}), 404
        return jsonify({'ad': ad.to_dict()}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching ad: {e}'}), 500

@app.route('/api/ads/<int:ad_id>', methods=['PUT'])
@token_required
def update_ad(current_user, ad_id):
    """Update an ad"""
    try:
        ad = db.session.get(Ad, ad_id)
        if not ad or ad.user_id != current_user.id:
            return jsonify({'message': 'Ad not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            ad.title = data['title']
        if 'caption' in data:
            ad.caption = data['caption']
        if 'image_url' in data:
            ad.image_url = data['image_url']
        if 'platforms' in data:
            ad.platforms = ','.join(data['platforms']) if data['platforms'] else ''
        if 'status' in data:
            old_status = ad.status
            ad.status = data['status']
            
            # Log activity based on status change
            if old_status != 'Posted' and data['status'] == 'Posted':
                activity = Activity(
                    user_id=current_user.id,
                    type='post',
                    message=f'Posted "{ad.title}" to {ad.platforms}',
                    icon_type='share2'
                )
                db.session.add(activity)
                ad.published_at = datetime.utcnow()
            elif data['status'] == 'Scheduled':
                activity = Activity(
                    user_id=current_user.id,
                    type='schedule',
                    message=f'Scheduled post "{ad.title}"',
                    icon_type='calendar'
                )
                db.session.add(activity)
        
        if 'scheduled_date' in data:
            ad.scheduled_date = datetime.fromisoformat(data['scheduled_date']) if data['scheduled_date'] else None
        if 'impressions' in data:
            ad.impressions = data['impressions']
        if 'engagement' in data:
            ad.engagement = data['engagement']
        
        db.session.commit()
        return jsonify({'message': 'Ad updated', 'ad': ad.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating ad: {e}'}), 500

@app.route('/api/ads/<int:ad_id>', methods=['DELETE'])
@token_required
def delete_ad(current_user, ad_id):
    """Delete an ad"""
    try:
        ad = db.session.get(Ad, ad_id)
        if not ad or ad.user_id != current_user.id:
            return jsonify({'message': 'Ad not found'}), 404
        
        db.session.delete(ad)
        db.session.commit()
        return jsonify({'message': 'Ad deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting ad: {e}'}), 500

# --- Activity API ---
@app.route('/api/activities', methods=['GET'])
@token_required
def list_activities(current_user):
    """Get activity feed for current user"""
    try:
        limit = request.args.get('limit', 10, type=int)
        activities = Activity.query.filter_by(user_id=current_user.id).order_by(Activity.created_at.desc()).limit(limit).all()
        return jsonify({'activities': [a.to_dict() for a in activities]}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching activities: {e}'}), 500

# --- Analytics API ---
@app.route('/api/analytics/kpis', methods=['GET'])
@token_required
def get_kpis(current_user):
    """Get KPI data for dashboard"""
    try:
        # Calculate KPIs from ads
        ads = Ad.query.filter_by(user_id=current_user.id).all()
        total_ads = len(ads)
        published_ads = len([a for a in ads if a.status == 'Posted'])
        total_impressions = sum([a.impressions for a in ads])
        total_engagement = sum([a.engagement for a in ads])
        scheduled_ads = len([a for a in ads if a.status == 'Scheduled'])
        
        # Calculate changes (mock data - in production would compare with previous period)
        kpis = [
            {
                'label': 'Total Ads Generated',
                'value': total_ads,
                'change': '+12%',
                'color': 'from-purple-500 to-pink-500',
                'icon': 'Zap'
            },
            {
                'label': 'Ads Published',
                'value': published_ads,
                'change': '+8%',
                'color': 'from-blue-500 to-cyan-500',
                'icon': 'Share2'
            },
            {
                'label': 'Total Impressions',
                'value': total_impressions,
                'change': '+24%',
                'color': 'from-emerald-500 to-teal-500',
                'icon': 'Eye'
            },
            {
                'label': 'Total Engagements',
                'value': total_engagement,
                'change': '+18%',
                'color': 'from-orange-500 to-red-500',
                'icon': 'Heart'
            },
            {
                'label': 'Scheduled Posts',
                'value': scheduled_ads,
                'change': '+5',
                'color': 'from-violet-500 to-purple-500',
                'icon': 'Clock'
            }
        ]
        return jsonify({'kpis': kpis}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching KPIs: {e}'}), 500

@app.route('/api/analytics/platform', methods=['GET'])
@token_required
def get_platform_analytics(current_user):
    """Get analytics by platform"""
    try:
        platforms = ['instagram', 'x', 'facebook', 'linkedin', 'tiktok']
        platform_data = []
        
        ads = Ad.query.filter_by(user_id=current_user.id).all()
        
        for platform in platforms:
            platform_ads = [a for a in ads if platform in a.platforms]
            impressions = sum([a.impressions for a in platform_ads])
            engagement = sum([a.engagement for a in platform_ads])
            ctr = (engagement / impressions * 100) if impressions > 0 else 0
            
            platform_data.append({
                'platform': platform.capitalize(),
                'impressions': impressions,
                'engagement': engagement,
                'ctr': f'{ctr:.1f}%',
                'growth': '+12%' if platform == 'instagram' else '+8%' if platform == 'x' else '+5%'
            })
        
        return jsonify({'analytics': platform_data}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching platform analytics: {e}'}), 500

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

# --- Facebook/Instagram API Helpers ---

def get_facebook_page_token(user_access_token):
    """Exchange user access token for page access token"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        url = f"https://graph.facebook.com/{api_version}/me/accounts"
        
        print(f"Fetching Facebook accounts from {url}")
        resp = requests.get(url, params={'access_token': user_access_token}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        # Check for errors in response
        if 'error' in data:
            print(f"Facebook API error: {data.get('error')}")
            return None
        
        accounts = data.get('data', [])
        print(f"Found {len(accounts)} Facebook accounts")
        
        if accounts:
            page_token = accounts[0].get('access_token')
            page_id = accounts[0].get('id')
            print(f"Using page {page_id} with token")
            return page_token
        
        print("No Facebook accounts found in response")
        return None
    except Exception as e:
        print(f"Error getting Facebook page token: {e}")
        return None

def get_instagram_business_accounts(page_access_token):
    """Get Instagram business accounts connected to Facebook page"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        page_id = os.getenv('FACEBOOK_PAGE_ID')
        if not page_id:
            print("FACEBOOK_PAGE_ID not configured")
            return []
        
        # First try: Get directly from page
        url = f"https://graph.facebook.com/{api_version}/{page_id}"
        resp = requests.get(
            url, 
            params={
                'fields': 'instagram_business_account',
                'access_token': page_access_token
            },
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        
        # Check if instagram_business_account is nested
        ig_account = data.get('instagram_business_account')
        if ig_account and ig_account.get('id'):
            return [{
                'id': ig_account.get('id'),
                'username': ig_account.get('username', 'instagram_account')
            }]
        
        # Second try: Get from page's Instagram accounts endpoint
        url = f"https://graph.facebook.com/{api_version}/{page_id}/instagram_accounts"
        resp = requests.get(
            url,
            params={
                'fields': 'id,username',
                'access_token': page_access_token
            },
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        accounts = data.get('data', [])
        if accounts:
            return accounts
        
        print(f"No Instagram business accounts found. Response: {data}")
        return []
    except Exception as e:
        print(f"Error getting Instagram business accounts: {e}")
        return []

def publish_to_facebook(page_access_token, caption, image_url=None):
    """Publish a post to Facebook page"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        page_id = os.getenv('FACEBOOK_PAGE_ID')
        
        if not page_id:
            raise ValueError("FACEBOOK_PAGE_ID not configured")
        
        url = f"https://graph.facebook.com/{api_version}/{page_id}/feed"
        
        payload = {
            'message': caption,
            'access_token': page_access_token
        }
        
        if image_url:
            payload['link'] = image_url
        
        resp = requests.post(url, data=payload, timeout=10)
        resp.raise_for_status()
        result = resp.json()
        return result.get('id'), None
    except Exception as e:
        error_msg = str(e)
        print(f"Error publishing to Facebook: {error_msg}")
        return None, error_msg

def publish_to_instagram(ig_account_id, page_access_token, caption, image_url=None):
    """Publish a post to Instagram business account"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        
        if not ig_account_id:
            raise ValueError("Instagram account ID is required")
        
        if not image_url:
            raise ValueError("Image URL is required for Instagram posts")
        
        # Step 1: Create a media object
        media_url = f"https://graph.instagram.com/{api_version}/{ig_account_id}/media"
        media_payload = {
            'image_url': image_url,
            'caption': caption,
            'access_token': page_access_token
        }
        
        print(f"Creating Instagram media at {media_url}")
        media_resp = requests.post(media_url, data=media_payload, timeout=10)
        
        # Log the response for debugging
        print(f"Media creation response status: {media_resp.status_code}")
        print(f"Media creation response: {media_resp.text}")
        
        media_resp.raise_for_status()
        media_data = media_resp.json()
        media_id = media_data.get('id')
        
        if not media_id:
            error_msg = media_data.get('error', {}).get('message', 'Failed to get media ID')
            raise ValueError(f"Failed to create Instagram media object: {error_msg}")
        
        print(f"Media created with ID: {media_id}")
        
        # Step 2: Publish the media
        publish_url = f"https://graph.instagram.com/{api_version}/{ig_account_id}/media_publish"
        publish_payload = {
            'creation_id': media_id,
            'access_token': page_access_token
        }
        
        print(f"Publishing media from {publish_url}")
        publish_resp = requests.post(publish_url, data=publish_payload, timeout=10)
        
        # Log the response for debugging
        print(f"Publish response status: {publish_resp.status_code}")
        print(f"Publish response: {publish_resp.text}")
        
        publish_resp.raise_for_status()
        result = publish_resp.json()
        post_id = result.get('id')
        
        if not post_id:
            raise ValueError("Failed to publish Instagram media")
        
        print(f"Successfully published to Instagram with post ID: {post_id}")
        return post_id, None
    except Exception as e:
        error_msg = str(e)
        print(f"Error publishing to Instagram: {error_msg}")
        return None, error_msg

def get_facebook_insights(page_access_token, post_id):
    """Get engagement metrics for a Facebook post"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        url = f"https://graph.facebook.com/{api_version}/{post_id}"
        resp = requests.get(
            url,
            params={
                'fields': 'shares,likes.summary(total_count).limit(0),comments.summary(total_count).limit(0),type,message,created_time',
                'access_token': page_access_token
            },
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error fetching Facebook insights: {e}")
        return None

def get_instagram_insights(ig_media_id, page_access_token):
    """Get engagement metrics for an Instagram media post"""
    try:
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        url = f"https://graph.instagram.com/{api_version}/{ig_media_id}"
        resp = requests.get(
            url,
            params={
                'fields': 'like_count,comments_count,caption,media_type,timestamp',
                'access_token': page_access_token
            },
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error fetching Instagram insights: {e}")
        return None

# --- API Routes ---

@app.route('/api/generate-ad', methods=['POST'])
def generate_ad_route():
    """
    The main API endpoint to generate ad content.
    Receives form data and an optional image.
    """
    try:
        # Get user from token if authenticated
        user_id = None
        token = request.headers.get('Authorization')
        if token:
            try:
                if token.startswith('Bearer '):
                    token = token[7:]
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user_id = data['user_id']
            except:
                pass
        
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

        # Save ad to database if user is authenticated
        if user_id:
            try:
                ad = Ad(
                    user_id=user_id,
                    title=description[:100],
                    caption=generated_caption,
                    image_url=image_url_for_response,
                    platforms=','.join(platforms) if platforms else '',
                    status='Draft'
                )
                db.session.add(ad)
                
                # Log activity
                activity = Activity(
                    user_id=user_id,
                    type='draft',
                    message=f'Generated new ad',
                    icon_type='zap'
                )
                db.session.add(activity)
                db.session.commit()
            except Exception as e:
                print(f"Error saving ad: {e}")
                db.session.rollback()

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


# --- OAuth helper endpoints (LinkedIn implemented as example) ---
def _get_redirect_base():
    # In production, set this to your frontend URL
    return os.getenv('SERVER_BASE', 'http://localhost:5000')


@app.route('/api/accounts/oauth/<provider>/start', methods=['GET'])
@token_required
def oauth_start(current_user, provider):
    """Return OAuth authorization URL for supported providers.
    Currently implements LinkedIn. Frontend should open the returned URL in a new window.
    """
    provider = provider.lower()
    # Redirect should point to the server callback by default
    redirect_uri = os.getenv('LINKEDIN_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/linkedin/callback"

    # LinkedIn
    if provider == 'linkedin':
        client_id = os.getenv('LINKEDIN_CLIENT_ID')
        if not client_id:
            return jsonify({'message': 'LinkedIn client ID not configured'}), 500

        params = {
            'response_type': 'code',
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': 'r_liteprofile r_emailaddress',
            'state': f'user-{current_user.id}-{int(datetime.utcnow().timestamp())}'
        }
        url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
        return jsonify({'authUrl': url}), 200

    # Twitter / X (OAuth2 authorization code)
    if provider in ('x', 'twitter'):
        client_id = os.getenv('X_CLIENT_ID')
        if not client_id:
            return jsonify({'message': 'Twitter/X client ID not configured'}), 500

        params = {
            'response_type': 'code',
            'client_id': client_id,
            'redirect_uri': os.getenv('X_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/x/callback",
            'scope': 'tweet.read users.read offline.access',
            'state': f'user-{current_user.id}-{int(datetime.utcnow().timestamp())}',
            # PKCE flow normally requires code_challenge here. For simple testing, we omit PKCE.
        }
        url = f"https://twitter.com/i/oauth2/authorize?{urlencode(params)}"
        return jsonify({'authUrl': url}), 200

    # Facebook / Instagram (via Facebook OAuth)
    if provider in ('facebook', 'instagram'):
        client_id = os.getenv('FACEBOOK_CLIENT_ID')
        if not client_id:
            return jsonify({'message': 'Facebook client ID not configured'}), 500
        fb_redirect = os.getenv('FACEBOOK_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/facebook/callback"
        params = {
            'client_id': client_id,
            'redirect_uri': fb_redirect,
            'state': f'user-{current_user.id}-{int(datetime.utcnow().timestamp())}',
            'scope': 'public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish'
        }
        url = f"https://www.facebook.com/v16.0/dialog/oauth?{urlencode(params)}"
        return jsonify({'authUrl': url}), 200

    # TikTok OAuth
    if provider == 'tiktok':
        client_key = os.getenv('TIKTOK_CLIENT_KEY') or os.getenv('TIKTOK_CLIENT_ID')
        if not client_key:
            return jsonify({'message': 'TikTok client id not configured'}), 500
        tt_redirect = os.getenv('TIKTOK_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/tiktok/callback"
        params = {
            'client_key': client_key,
            'response_type': 'code',
            'scope': 'user.info.basic',
            'redirect_uri': tt_redirect,
            'state': f'user-{current_user.id}-{int(datetime.utcnow().timestamp())}'
        }
        url = f"https://open-api.tiktok.com/platform/oauth/connect?{urlencode(params)}"
        return jsonify({'authUrl': url}), 200

    return jsonify({'message': f'OAuth not implemented for provider: {provider}'}), 400


@app.route('/api/accounts/oauth/linkedin/callback', methods=['GET'])
def linkedin_callback():
    """Callback endpoint that LinkedIn will redirect to with ?code=...&state=..."""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    if error:
        return jsonify({'message': f'LinkedIn authorization error: {error}'}), 400

    if not code:
        return jsonify({'message': 'Missing code from LinkedIn'}), 400

    client_id = os.getenv('LINKEDIN_CLIENT_ID')
    client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
    redirect_uri = os.getenv('LINKEDIN_REDIRECT_URI') or f"{_get_redirect_base()}/oauth/linkedin/callback"

    if not client_id or not client_secret:
        return jsonify({'message': 'LinkedIn client credentials not configured'}), 500

    # Exchange code for access token
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret
    }

    try:
        resp = requests.post(token_url, data=payload, timeout=10)
        resp.raise_for_status()
        token_data = resp.json()
        access_token = token_data.get('access_token')
    except Exception as e:
        return jsonify({'message': f'Failed exchanging code for token: {e}'}), 500

    # Fetch basic profile
    try:
        profile_resp = requests.get('https://api.linkedin.com/v2/me', headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
        profile_resp.raise_for_status()
        profile = profile_resp.json()
        # Construct a friendly username
        first = profile.get('localizedFirstName') or ''
        last = profile.get('localizedLastName') or ''
        username = (first + ' ' + last).strip() or profile.get('id')
    except Exception as e:
        username = profile.get('id') if isinstance(profile, dict) and profile.get('id') else 'linkedin_user'

    # For demonstration, we will *not* try to identify the logged-in app user via state.
    # Instead, store a placeholder SocialAccount with user_id = 1 if it exists, or create user-less account.
    # In production, you should validate `state` and associate with the authenticated user.

    # Try to associate with user id if encoded in state
    user_to_assign = None
    try:
            if state and state.startswith('user-'):
                parts = state.split('-')
                uid = int(parts[1])
                user_to_assign = db.session.get(User, uid)
    except Exception:
        user_to_assign = None

    if not user_to_assign:
        # fallback: choose first user to make local testing easier
        user_to_assign = User.query.first()

    if not user_to_assign:
        return jsonify({'message': 'No user available to associate account with. Create a user first.'}), 400

    # Save SocialAccount
    try:
        existing = SocialAccount.query.filter_by(user_id=user_to_assign.id, provider='linkedin').first()
        if existing:
            existing.username = username
            existing.token = access_token
            existing.connected = True
            db.session.commit()
            saved = existing
        else:
            saved = SocialAccount(user_id=user_to_assign.id, provider='linkedin', username=username, token=access_token, connected=True)
            db.session.add(saved)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed saving LinkedIn account: {e}'}), 500

    # For SPA flows, redirect back to frontend with a success message
    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    frontend_redirect = f"{frontend_base}/?oauth=linkedin&status=success"
    return ("<script>window.opener && window.opener.postMessage({status:'ok',provider:'linkedin'}, '*');window.location='" + frontend_redirect + "';</script>"), 200


@app.route('/api/accounts/oauth/x/callback', methods=['GET'])
def x_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    if error:
        return jsonify({'message': f'Twitter/X authorization error: {error}'}), 400
    if not code:
        return jsonify({'message': 'Missing code from Twitter/X'}), 400

    client_id = os.getenv('X_CLIENT_ID')
    client_secret = os.getenv('X_CLIENT_SECRET')
    redirect_uri = os.getenv('X_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/x/callback"

    token_url = 'https://api.twitter.com/2/oauth2/token'
    try:
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'client_id': client_id,
        }
        # If client_secret exists, send basic auth
        if client_secret:
            auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            headers['Authorization'] = f'Basic {auth}'
        resp = requests.post(token_url, data=data, headers=headers, timeout=10)
        resp.raise_for_status()
        token_data = resp.json()
        access_token = token_data.get('access_token')
    except Exception as e:
        return jsonify({'message': f'Failed exchanging code for token (X): {e}'}), 500

    # Fetch profile
    username = 'x_user'
    try:
        profile_resp = requests.get('https://api.twitter.com/2/users/me', headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
        profile_resp.raise_for_status()
        p = profile_resp.json().get('data', {})
        username = p.get('username') or p.get('name') or p.get('id')
    except Exception:
        pass

    # Associate account to user (state or fallback)
    user_to_assign = None
    try:
        if state and state.startswith('user-'):
            parts = state.split('-')
            uid = int(parts[1])
            user_to_assign = db.session.get(User, uid)
    except Exception:
        user_to_assign = None
    if not user_to_assign:
        user_to_assign = User.query.first()
    if not user_to_assign:
        return jsonify({'message': 'No user available to associate account with. Create a user first.'}), 400

    try:
        existing = SocialAccount.query.filter_by(user_id=user_to_assign.id, provider='x').first()
        if existing:
            existing.username = username
            existing.token = access_token
            existing.connected = True
            db.session.commit()
            saved = existing
        else:
            saved = SocialAccount(user_id=user_to_assign.id, provider='x', username=username, token=access_token, connected=True)
            db.session.add(saved)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed saving X account: {e}'}), 500

    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    frontend_redirect = f"{frontend_base}/?oauth=x&status=success"
    return ("<script>window.opener && window.opener.postMessage({status:'ok',provider:'x'}, '*');window.location='" + frontend_redirect + "';</script>"), 200


@app.route('/api/accounts/oauth/facebook/callback', methods=['GET'])
def facebook_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    if error:
        return jsonify({'message': f'Facebook authorization error: {error}'}), 400
    if not code:
        return jsonify({'message': 'Missing code from Facebook'}), 400

    client_id = os.getenv('FACEBOOK_CLIENT_ID')
    client_secret = os.getenv('FACEBOOK_CLIENT_SECRET')
    redirect_uri = os.getenv('FACEBOOK_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/facebook/callback"

    token_url = 'https://graph.facebook.com/v16.0/oauth/access_token'
    try:
        resp = requests.get(token_url, params={'client_id': client_id, 'redirect_uri': redirect_uri, 'client_secret': client_secret, 'code': code}, timeout=10)
        resp.raise_for_status()
        token_data = resp.json()
        access_token = token_data.get('access_token')
    except Exception as e:
        return jsonify({'message': f'Failed exchanging code for token (Facebook): {e}'}), 500

    username = 'facebook_user'
    try:
        profile_resp = requests.get('https://graph.facebook.com/me', params={'access_token': access_token, 'fields': 'id,name'}, timeout=10)
        profile_resp.raise_for_status()
        p = profile_resp.json()
        username = p.get('name') or p.get('id')
    except Exception:
        pass

    user_to_assign = None
    try:
        if state and state.startswith('user-'):
            parts = state.split('-')
            uid = int(parts[1])
            user_to_assign = db.session.get(User, uid)
    except Exception:
        user_to_assign = None
    if not user_to_assign:
        user_to_assign = User.query.first()
    if not user_to_assign:
        return jsonify({'message': 'No user available to associate account with. Create a user first.'}), 400

    try:
        existing = SocialAccount.query.filter_by(user_id=user_to_assign.id, provider='facebook').first()
        if existing:
            existing.username = username
            existing.token = access_token
            existing.connected = True
            db.session.commit()
            saved = existing
        else:
            saved = SocialAccount(user_id=user_to_assign.id, provider='facebook', username=username, token=access_token, connected=True)
            db.session.add(saved)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed saving Facebook account: {e}'}), 500

    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    frontend_redirect = f"{frontend_base}/?oauth=facebook&status=success"
    return ("<script>window.opener && window.opener.postMessage({status:'ok',provider:'facebook'}, '*');window.location='" + frontend_redirect + "';</script>"), 200


@app.route('/api/publish/facebook', methods=['POST'])
@token_required
def publish_to_facebook_route(current_user):
    """Publish an ad to Facebook page"""
    try:
        data = request.get_json()
        
        caption = data.get('caption')
        image_url = data.get('image_url')
        ad_id = data.get('ad_id')
        
        if not caption:
            return jsonify({'message': 'Caption is required'}), 400
        
        # Get user's Facebook account
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found'}), 400
        
        # Get page access token
        page_token = get_facebook_page_token(fb_account.token)
        if not page_token:
            return jsonify({'message': 'Failed to get Facebook page access token'}), 500
        
        # Publish to Facebook
        post_id, error = publish_to_facebook(page_token, caption, image_url)
        
        if error:
            return jsonify({'message': f'Failed to publish to Facebook: {error}'}), 500
        
        # Update ad status if provided
        if ad_id:
            try:
                ad = db.session.get(Ad, ad_id)
                if ad and ad.user_id == current_user.id:
                    ad.status = 'Posted'
                    ad.published_at = datetime.utcnow()
                    db.session.commit()
                    
                    # Log activity
                    activity = Activity(
                        user_id=current_user.id,
                        type='post',
                        message=f'Published to Facebook: {caption[:50]}...',
                        icon_type='share2'
                    )
                    db.session.add(activity)
                    db.session.commit()
            except Exception as e:
                print(f"Error updating ad status: {e}")
        
        return jsonify({
            'message': 'Successfully published to Facebook',
            'post_id': post_id
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in publish_to_facebook_route: {e}")
        return jsonify({'message': f'Error publishing to Facebook: {str(e)}'}), 500


@app.route('/api/publish/instagram', methods=['POST'])
@token_required
def publish_to_instagram_route(current_user):
    """Publish an ad to Instagram business account"""
    try:
        data = request.get_json()
        
        caption = data.get('caption')
        image_url = data.get('image_url')
        ad_id = data.get('ad_id')
        ig_account_id = data.get('ig_account_id')  # Can be provided directly
        
        if not caption or not image_url:
            return jsonify({'message': 'Caption and image URL are required'}), 400
        
        # Get user's Facebook account (Instagram is accessed via Facebook OAuth)
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found. Please connect Facebook first.'}), 400
        
        # Get page access token
        page_token = get_facebook_page_token(fb_account.token)
        if not page_token:
            return jsonify({'message': 'Failed to get Facebook page access token. Try reconnecting your Facebook account.'}), 500
        
        # If account ID not provided, get Instagram business accounts
        if not ig_account_id:
            ig_accounts = get_instagram_business_accounts(page_token)
            if not ig_accounts:
                return jsonify({'message': 'No Instagram business account connected to your Facebook page. Please connect an Instagram business account to your Facebook page.'}), 400
            
            ig_account_id = ig_accounts[0].get('id')
            if not ig_account_id:
                return jsonify({'message': 'Instagram account ID is missing'}), 400
        
        # Publish to Instagram
        media_id, error = publish_to_instagram(ig_account_id, page_token, caption, image_url)
        
        if error:
            return jsonify({'message': f'Failed to publish to Instagram: {error}'}), 500
        
        # Update ad status if provided
        if ad_id:
            try:
                ad = db.session.get(Ad, ad_id)
                if ad and ad.user_id == current_user.id:
                    ad.status = 'Posted'
                    ad.published_at = datetime.utcnow()
                    db.session.commit()
                    
                    # Log activity
                    activity = Activity(
                        user_id=current_user.id,
                        type='post',
                        message=f'Published to Instagram: {caption[:50]}...',
                        icon_type='instagram'
                    )
                    db.session.add(activity)
                    db.session.commit()
            except Exception as e:
                print(f"Error updating ad status: {e}")
        
        return jsonify({
            'message': 'Successfully published to Instagram',
            'media_id': media_id
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in publish_to_instagram_route: {e}")
        return jsonify({'message': f'Error publishing to Instagram: {str(e)}'}), 500


@app.route('/api/insights/facebook/<post_id>', methods=['GET'])
@token_required
def get_facebook_post_insights(current_user, post_id):
    """Get insights for a Facebook post"""
    try:
        # Get user's Facebook account
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found'}), 400
        
        # Get page access token
        page_token = get_facebook_page_token(fb_account.token)
        if not page_token:
            return jsonify({'message': 'Failed to get Facebook page access token'}), 500
        
        # Fetch insights
        insights = get_facebook_insights(page_token, post_id)
        
        if not insights:
            return jsonify({'message': 'Failed to retrieve insights'}), 500
        
        return jsonify({
            'insights': insights
        }), 200
    
    except Exception as e:
        print(f"Error fetching Facebook insights: {e}")
        return jsonify({'message': f'Error fetching insights: {str(e)}'}), 500


@app.route('/api/insights/instagram/<media_id>', methods=['GET'])
@token_required
def get_instagram_media_insights(current_user, media_id):
    """Get insights for an Instagram media post"""
    try:
        # Get user's Facebook account
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found'}), 400
        
        # Get page access token
        page_token = get_facebook_page_token(fb_account.token)
        if not page_token:
            return jsonify({'message': 'Failed to get Facebook page access token'}), 500
        
        # Fetch insights
        insights = get_instagram_insights(media_id, page_token)
        
        if not insights:
            return jsonify({'message': 'Failed to retrieve insights'}), 500
        
        return jsonify({
            'insights': insights
        }), 200
    
    except Exception as e:
        print(f"Error fetching Instagram insights: {e}")
        return jsonify({'message': f'Error fetching insights: {str(e)}'}), 500


@app.route('/api/accounts/facebook/pages', methods=['GET'])
@token_required
def get_facebook_pages(current_user):
    """Get available Facebook pages for publishing"""
    try:
        # Get user's Facebook account
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found'}), 400
        
        api_version = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
        url = f"https://graph.facebook.com/{api_version}/me/accounts"
        resp = requests.get(
            url,
            params={'access_token': fb_account.token},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        pages = data.get('data', [])
        
        return jsonify({
            'pages': [
                {
                    'id': page.get('id'),
                    'name': page.get('name'),
                    'access_token': page.get('access_token')
                }
                for page in pages
            ]
        }), 200
    
    except Exception as e:
        print(f"Error fetching Facebook pages: {e}")
        return jsonify({'message': f'Error fetching pages: {str(e)}'}), 500


@app.route('/api/accounts/instagram/accounts', methods=['GET'])
@token_required
def get_instagram_accounts(current_user):
    """Get available Instagram business accounts"""
    try:
        # Get user's Facebook account
        fb_account = SocialAccount.query.filter_by(
            user_id=current_user.id,
            provider='facebook',
            connected=True
        ).first()
        
        if not fb_account or not fb_account.token:
            return jsonify({'message': 'No connected Facebook account found', 'accounts': []}), 200
        
        # Get page access token
        page_token = get_facebook_page_token(fb_account.token)
        if not page_token:
            return jsonify({'message': 'Failed to get Facebook page access token', 'accounts': []}), 200
        
        # Get Instagram accounts
        ig_accounts = get_instagram_business_accounts(page_token)
        
        if not ig_accounts:
            print("Warning: No Instagram business accounts found")
        
        return jsonify({
            'accounts': [
                {
                    'id': acc.get('id'),
                    'username': acc.get('username', 'instagram_account')
                }
                for acc in ig_accounts
            ],
            'message': 'Instagram accounts retrieved successfully' if ig_accounts else 'No Instagram business accounts connected'
        }), 200
    
    except Exception as e:
        print(f"Error fetching Instagram accounts: {e}")
        return jsonify({'message': f'Error fetching Instagram accounts: {str(e)}', 'accounts': []}), 500
        return jsonify({'message': f'Error fetching accounts: {str(e)}'}), 500


@app.route('/api/accounts/oauth/tiktok/callback', methods=['GET'])
def tiktok_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    if error:
        return jsonify({'message': f'TikTok authorization error: {error}'}), 400
    if not code:
        return jsonify({'message': 'Missing code from TikTok'}), 400

    client_key = os.getenv('TIKTOK_CLIENT_KEY') or os.getenv('TIKTOK_CLIENT_ID')
    client_secret = os.getenv('TIKTOK_CLIENT_SECRET')
    redirect_uri = os.getenv('TIKTOK_REDIRECT_URI') or f"{_get_redirect_base()}/api/accounts/oauth/tiktok/callback"

    token_url = 'https://open-api.tiktok.com/oauth/access_token'
    try:
        resp = requests.post(token_url, data={'client_key': client_key, 'client_secret': client_secret, 'code': code, 'grant_type': 'authorization_code', 'redirect_uri': redirect_uri}, timeout=10)
        resp.raise_for_status()
        token_data = resp.json()
        # token response structure may vary; try common keys
        access_token = token_data.get('data', {}).get('access_token') or token_data.get('access_token')
    except Exception as e:
        return jsonify({'message': f'Failed exchanging code for token (TikTok): {e}'}), 500

    username = 'tiktok_user'
    try:
        # User info endpoint - may vary by TikTok API version
        user_resp = requests.get('https://open-api.tiktok.com/oauth/userinfo/', params={'access_token': access_token}, timeout=10)
        user_resp.raise_for_status()
        p = user_resp.json().get('data', {})
        username = p.get('open_id') or p.get('display_name') or p.get('nickname')
    except Exception:
        pass

    user_to_assign = None
    try:
        if state and state.startswith('user-'):
            parts = state.split('-')
            uid = int(parts[1])
            user_to_assign = db.session.get(User, uid)
    except Exception:
        user_to_assign = None
    if not user_to_assign:
        user_to_assign = User.query.first()
    if not user_to_assign:
        return jsonify({'message': 'No user available to associate account with. Create a user first.'}), 400

    try:
        existing = SocialAccount.query.filter_by(user_id=user_to_assign.id, provider='tiktok').first()
        if existing:
            existing.username = username
            existing.token = access_token
            existing.connected = True
            db.session.commit()
            saved = existing
        else:
            saved = SocialAccount(user_id=user_to_assign.id, provider='tiktok', username=username, token=access_token, connected=True)
            db.session.add(saved)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed saving TikTok account: {e}'}), 500

    frontend_base = os.getenv('FRONTEND_BASE', 'http://localhost:3000')
    frontend_redirect = f"{frontend_base}/?oauth=tiktok&status=success"
    return ("<script>window.opener && window.opener.postMessage({status:'ok',provider:'tiktok'}, '*');window.location='" + frontend_redirect + "';</script>"), 200


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
        account = db.session.get(SocialAccount, account_id)
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