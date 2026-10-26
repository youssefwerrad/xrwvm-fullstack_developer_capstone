import React, { useState } from 'react';
import './Register.css';
import Header from '../Header/Header';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async (e) => {
    e.preventDefault();
    const res = await fetch(`${window.location.origin}/djangoapp/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        userName,
        email,
        password,
      }),
    });

    const json = await res.json();
    if (res.ok && json.status === 'Registered') {
      sessionStorage.setItem('username', json.userName);
      window.location.href = '/';
      return;
    }

    alert(json.status || 'Registration failed');
  };

  return (
    <div className="auth-page">
      <Header />
      <main className="auth-content">
        <section className="auth-card">
          <p className="eyebrow">Join the community</p>
          <h1>Create your account</h1>
          <form className="auth-form" onSubmit={register}>
            <div className="auth-fields-grid">
              <div>
                <label htmlFor="first-name">First name</label>
                <input id="first-name" autoComplete="given-name" required placeholder="First name" onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="last-name">Last name</label>
                <input id="last-name" autoComplete="family-name" required placeholder="Last name" onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="register-username">Username</label>
                <input id="register-username" autoComplete="username" required placeholder="Choose a username" onChange={(e) => setUserName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" autoComplete="email" required placeholder="you@example.com" type="email" onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="auth-full-width">
                <label htmlFor="register-password">Password</label>
                <input id="register-password" autoComplete="new-password" required placeholder="Create a password" type="password" onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button className="site-button" type="submit">Create account</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Register;
