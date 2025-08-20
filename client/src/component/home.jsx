import { Link } from 'react-router-dom';

export default function Home() {
  const rideId = "68a54edb44dbe65141faa141"; // dynamically get ride id

  const handlePay = async () => {
    
    const res = await fetch(`http://localhost:3000/ride/${rideId}/pay`, {
      method: 'POST',
      credentials: 'include', // if using cookies
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // redirect to Stripe checkout
    }
  };

  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={handlePay}>Pay for Ride</button>
    </div>
  );
}
