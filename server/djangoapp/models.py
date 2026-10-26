from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class CarModel(models.Model):
    BODY_TYPES = [
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('HATCHBACK', 'Hatchback'),
        ('MINIVAN', 'Minivan'),
        ('COUPE', 'Coupe'),
        ('WAGON', 'Wagon'),
    ]

    make = models.ForeignKey(CarMake, related_name='models', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    body_type = models.CharField(max_length=20, choices=BODY_TYPES, default='SEDAN')
    year = models.IntegerField(default=2023, validators=[MinValueValidator(2015), MaxValueValidator(2023)])

    def __str__(self):
        return f"{self.make.name} {self.name} ({self.year})"


class Dealer(models.Model):
    id = models.IntegerField(primary_key=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    zip = models.CharField(max_length=20)
    lat = models.FloatField(default=0.0, null=True, blank=True)
    long = models.FloatField(default=0.0, null=True, blank=True)
    short_name = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=255)

    def __str__(self):
        return self.full_name


class Review(models.Model):
    name = models.CharField(max_length=200)
    dealership = models.IntegerField(default=1)
    review = models.TextField()
    purchase = models.BooleanField(default=True)
    purchase_date = models.DateField(null=True, blank=True)
    car_make = models.CharField(max_length=100)
    car_model = models.CharField(max_length=100)
    car_year = models.IntegerField(default=2023, validators=[MinValueValidator(2015), MaxValueValidator(2023)])
    sentiment = models.CharField(max_length=20, default='neutral')

    def __str__(self):
        return f"{self.name}: {self.car_make} {self.car_model}"
