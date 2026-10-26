import React, { useState } from 'react';

import "./Login.css";
import Header from '../Header/Header';

const Login = ({ onClose }) => {

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [open,setOpen] = useState(true)

  let login_url = window.location.origin+"/djangoapp/login";

  const login = async (e) => {
    e.preventDefault();

    const res = await fetch(login_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "userName": userName,
            "password": password
        }),
    });
    
    const json = await res.json();
    if (json.status != null && json.status === "Authenticated") {
        sessionStorage.setItem('username', json.userName);
        setOpen(false);        
    }
    else {
      alert("The user could not be authenticated.")
    }
};

  if (!open) {
    window.location.href = "/";
  };
  

  return (
    <div className="auth-page">
      <Header/>
      <main className="auth-content" onClick={onClose}>
      <section
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="auth-card"
      >
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to your account</h1>
        <form className="auth-form" onSubmit={login}>
          <label htmlFor="username">Username</label>
          <input id="username" type="text" name="username" placeholder="Your username" autoComplete="username" required onChange={(e) => setUserName(e.target.value)} />
          <label htmlFor="password">Password</label>
          <input id="password" name="psw" type="password" placeholder="Your password" autoComplete="current-password" required onChange={(e) => setPassword(e.target.value)} />
          <div className="auth-actions">
            <button className="site-button" type="submit">Login</button>
            <button className="site-button site-button-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <p className="auth-footnote">New here? <a href="/register">Create an account</a></p>
        </form>
      </section>
      </main>
    </div>
  );
};

export default Login;
