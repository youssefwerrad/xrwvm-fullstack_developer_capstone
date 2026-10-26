import { Routes, Route } from 'react-router-dom';
import LoginPanel from './components/Login/Login';
import Register from './components/Register/Register';
import Dealers from './components/Dealers/Dealers';
import Dealer from './components/Dealers/Dealer';
import PostReview from './components/Dealers/PostReview';
import Header from './components/Header/Header';
import './App.css';

function HomePage() {
  return (
    <div>
      <Header />
      <main>
        <section className="site-hero">
          <img src="/static/car_dealership.jpg" alt="" />
          <div className="site-hero-content">
            <p className="eyebrow">Find your next destination</p>
            <h1>A better way to find your dealership</h1>
            <p>Explore trusted local dealers and hear from drivers who have already made their choice.</p>
            <a href="/dealers" className="site-button">Browse dealerships</a>
          </div>
        </section>
        <section className="home-intro">
          <h2>Shop with more confidence</h2>
          <p>Compare dealership locations, browse customer reviews, and make your next car-buying decision with confidence.</p>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPanel />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dealers" element={<Dealers />} />
      <Route path="/dealer/:id" element={<Dealer />} />
      <Route path="/postreview/:id" element={<PostReview />} />
    </Routes>
  );
}

export default App;
