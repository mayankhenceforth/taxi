import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function Success() {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('rideId');

  if (!rideId) {
    return <p>No ride ID found!</p>;
  }

  const handleDownloadInvoice = async () => {
    try {
      // Request the PDF from your backend
      const response = await axios.get(
        `http://localhost:3000/ride/${rideId}/confirm-payment`,
          // empty body since endpoint doesn't require data
        {
          responseType: 'blob', // important to get the PDF as a Blob
        }
      );

      // Create a Blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${rideId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice');
    }
  };

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Ride ID: {rideId}</p>
      <button onClick={handleDownloadInvoice}>Download Invoice</button>
      <br />
      <a href="/">Go Home</a>
    </div>
  );
}
