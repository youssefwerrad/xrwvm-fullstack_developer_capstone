import json
import logging
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

import requests
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel, Dealer, Review

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent


def _seed_data():
    if Dealer.objects.exists():
        return

    data_dir = BASE_DIR / 'database' / 'data'
    dealership_data = json.loads((data_dir / 'dealerships.json').read_text())['dealerships']
    for dealer in dealership_data:
        Dealer.objects.update_or_create(
            id=dealer['id'],
            defaults={
                'city': dealer.get('city', ''),
                'state': dealer.get('state', ''),
                'address': dealer.get('address', ''),
                'zip': str(dealer.get('zip', '')),
                'lat': dealer.get('lat', 0.0),
                'long': dealer.get('long', 0.0),
                'short_name': dealer.get('short_name', ''),
                'full_name': dealer.get('full_name', ''),
            },
        )

    cars_data = json.loads((data_dir / 'car_records.json').read_text())['cars']
    for car in cars_data:
        make, _ = CarMake.objects.get_or_create(name=car.get('make', 'Unknown'))
        CarModel.objects.get_or_create(
            make=make,
            name=car.get('model', 'Unknown'),
            year=int(car.get('year', 2023)),
            defaults={'body_type': (car.get('bodyType', 'SEDAN') or 'SEDAN').upper()},
        )


def _sentiment_from_text(text):
    text = (text or '').strip().lower()
    if not text:
        return 'neutral'
    positive_words = ['great', 'excellent', 'love', 'amazing', 'good', 'happy', 'best', 'fantastic', 'smooth', 'friendly']
    negative_words = ['bad', 'terrible', 'awful', 'hate', 'poor', 'slow', 'worst', 'problem', 'rude', 'broken']
    if any(word in text for word in positive_words):
        return 'positive'
    if any(word in text for word in negative_words):
        return 'negative'
    return 'neutral'


def _analyze_sentiment(text):
    try:
        response = requests.get(
            f"http://127.0.0.1:5000/analyze/{quote(text)}",
            timeout=2,
        )
        if response.ok:
            payload = response.json()
            return payload.get('sentiment', _sentiment_from_text(text))
    except Exception:
        pass
    return _sentiment_from_text(text)


@csrf_exempt
def login_user(request):
    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        data = request.POST

    username = data.get('userName') or data.get('username')
    password = data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({'userName': username, 'status': 'Authenticated'})
    return JsonResponse({'status': 'Authentication failed'}, status=401)


@csrf_exempt
def logout_request(request):
    logout(request)
    return JsonResponse({'status': 'Logged out'})


@csrf_exempt
def registration(request):
    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        data = request.POST

    username = (data.get('userName') or data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    first_name = data.get('firstName') or data.get('first_name') or ''
    last_name = data.get('lastName') or data.get('last_name') or ''

    if not username or not password:
        return JsonResponse({'status': 'Missing required fields'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'status': 'User already exists'}, status=409)

    User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    return JsonResponse({'status': 'Registered', 'userName': username})


def get_dealerships(request):
    _seed_data()
    state = request.GET.get('state')
    queryset = Dealer.objects.all().order_by('id')
    if state and state.lower() != 'all':
        queryset = queryset.filter(state__iexact=state)
    return JsonResponse({'status': 200, 'dealers': list(queryset.values())})


@csrf_exempt
def get_dealerships_by_state(request, state):
    _seed_data()
    dealers = list(Dealer.objects.filter(state__iexact=state).order_by('id').values())
    return JsonResponse({'status': 200, 'dealers': dealers})


def get_dealer_details(request, dealer_id):
    _seed_data()
    dealer = Dealer.objects.filter(id=dealer_id).values().first()
    if dealer is None:
        return JsonResponse({'status': 404, 'message': 'Dealer not found'}, status=404)
    return JsonResponse({'status': 200, 'dealer': [dealer]})


def get_dealer_reviews(request, dealer_id):
    _seed_data()
    reviews = list(Review.objects.filter(dealership=dealer_id).order_by('-id').values())
    return JsonResponse({'status': 200, 'reviews': reviews})


@csrf_exempt
def add_review(request):
    _seed_data()
    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        return JsonResponse({'status': 400, 'message': 'Invalid JSON'}, status=400)

    required_fields = ['name', 'review', 'purchase_date', 'car_make', 'car_model', 'car_year']
    if any(field not in data for field in required_fields):
        return JsonResponse({'status': 400, 'message': 'Missing required review fields'}, status=400)

    sentiment = _analyze_sentiment(data['review'])
    review = Review.objects.create(
        name=data.get('name', ''),
        dealership=int(data.get('dealership', 1)),
        review=data.get('review', ''),
        purchase=bool(data.get('purchase', True)),
        purchase_date=datetime.strptime(data['purchase_date'], '%Y-%m-%d').date(),
        car_make=data.get('car_make', ''),
        car_model=data.get('car_model', ''),
        car_year=int(data.get('car_year', 2023)),
        sentiment=sentiment,
    )
    return JsonResponse({'status': 200, 'message': 'Review added', 'review_id': review.id})


def get_cars(request):
    _seed_data()
    models = list(
        CarModel.objects.select_related('make')
        .order_by('make__name', 'name')
        .values('make__name', 'name', 'body_type', 'year')
    )
    cars = [
        {
            'CarMake': item['make__name'],
            'CarModel': item['name'],
            'BodyType': item['body_type'],
            'Year': item['year'],
        }
        for item in models
    ]
    return JsonResponse({'status': 200, 'CarModels': cars})
