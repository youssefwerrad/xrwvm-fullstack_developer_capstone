import React, { useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png"

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [originalDealers, setOriginalDealers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    const filtered = originalDealers.filter((dealer) =>
      dealer.state.toLowerCase().includes(query.toLowerCase())
    );
    setDealersList(filtered);
  };

  const handleLostFocus = () => {
    if (!searchQuery.trim()) {
      setDealersList(originalDealers);
    }
  };

  const get_dealers = async ()=>{
    const res = await fetch("/djangoapp/get_dealers", {
      method: "GET"
    });
    const retobj = await res.json();
    if(retobj.status === 200) {
      const all_dealers = Array.from(retobj.dealers);
      setOriginalDealers(all_dealers);
      setDealersList(all_dealers);
    }
  }
  useEffect(() => {
    get_dealers();
  },[]);


let isLoggedIn = sessionStorage.getItem("username") != null ? true : false;
return(
  <div>
      <Header/>

     <main className="directory-page">
     <div className="page-heading">
       <p className="eyebrow">Find your local team</p>
       <h1>Dealership directory</h1>
       <p>Explore dealerships by state and read what customers have to say.</p>
     </div>
     <div className="directory-card">
     <table className='dealer-table'>
     <thead><tr>
      <th>ID</th>
      <th>Dealer Name</th>
      <th>City</th>
      <th>Address</th>
      <th>Zip</th>
      <th>
      <input
        type="text"
        placeholder="Search states..."
        onChange={handleInputChange}
        onBlur={handleLostFocus}
        value={searchQuery}
        aria-label="Search dealers by state"
      />

      </th>
      {isLoggedIn ? (
          <th>Review Dealer</th>
         ):<></>
      }
      </tr></thead>
      <tbody>
     {dealersList.map(dealer => (
        <tr key={dealer.id}>
          <td>{dealer['id']}</td>
          <td><a href={'/dealer/'+dealer['id']}>{dealer['full_name']}</a></td>
          <td>{dealer['city']}</td>
          <td>{dealer['address']}</td>
          <td>{dealer['zip']}</td>
          <td>{dealer['state']}</td>
          {isLoggedIn ? (
            <td><a href={`/postreview/${dealer['id']}`}><img src={review_icon} className="review_icon" alt="Post Review"/></a></td>
           ):<></>
          }
        </tr>
      ))}
      </tbody>
     </table>
     </div>
     </main>
  </div>
)
}

export default Dealers
