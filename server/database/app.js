const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3030;
const logger = console;
const dataDirectory = path.join(__dirname, 'data');
const reviewsData = JSON.parse(fs.readFileSync(path.join(dataDirectory, 'reviews.json'), 'utf8')).reviews;
const dealershipsData = JSON.parse(fs.readFileSync(path.join(dataDirectory, 'dealerships.json'), 'utf8')).dealerships;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const Reviews = require('./review');
const Dealerships = require('./dealership');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function handleError(res, error) {
  logger.error(error);
  return res.status(500).json({ error: 'Database request failed' });
}

async function seedCollections() {
  await Promise.all([
    ...dealershipsData.map((dealer) =>
      Dealerships.updateOne({ id: dealer.id }, { $setOnInsert: dealer }, { upsert: true }),
    ),
    ...reviewsData.map((review) =>
      Reviews.updateOne({ id: review.id }, { $setOnInsert: review }, { upsert: true }),
    ),
  ]);
}

app.get('/', (req, res) => {
  res.send('Welcome to the Mongoose API');
});

app.get('/health', (req, res) => {
  res.json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' });
});

app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find().sort({ id: 1 }).lean();
    res.json(documents);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Dealer ID must be an integer' });
  }

  try {
    const documents = await Reviews.find({ dealership: id }).sort({ id: 1 }).lean();
    res.json(documents);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find().sort({ id: 1 }).lean();
    res.json(documents);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = new RegExp(`^${escapeRegex(req.params.state)}$`, 'i');
    const documents = await Dealerships.find({ state }).sort({ id: 1 }).lean();
    res.json(documents);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Dealer ID must be an integer' });
  }

  try {
    const dealer = await Dealerships.findOne({ id }).lean();
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    res.json(dealer);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/insert_review', async (req, res) => {
  const data = req.body;
  const requiredFields = [
    'name',
    'dealership',
    'review',
    'purchase',
    'purchase_date',
    'car_make',
    'car_model',
    'car_year',
  ];
  if (!data || requiredFields.some((field) => data[field] === undefined || data[field] === '')) {
    return res.status(400).json({ error: 'All review fields are required' });
  }

  try {
    const lastReview = await Reviews.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
    const review = await Reviews.create({
      id: (lastReview?.id || 0) + 1,
      name: data.name,
      dealership: Number(data.dealership),
      review: data.review,
      purchase: Boolean(data.purchase),
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: Number(data.car_year),
    });
    res.status(201).json(review);
  } catch (error) {
    handleError(res, error);
  }
});

async function start() {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo_db:27017/dealershipsDB';
    await mongoose.connect(mongoUrl);
    await seedCollections();
    app.listen(port, '0.0.0.0', () => {
      logger.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Unable to start the API because MongoDB could not be initialized.', error);
    process.exitCode = 1;
  }
}

start();
