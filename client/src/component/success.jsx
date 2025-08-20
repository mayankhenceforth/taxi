import { useSearchParams } from 'react-router-dom';

export default function Success() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('rideId');

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Ride ID: {rideId}</p>
      <a href="/">Go Home</a>
    </div>
  );
}
