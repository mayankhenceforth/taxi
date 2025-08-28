export const baseUrl = " http://localhost:3000";

const SummaryApi = {
  signup: {
    url: `${baseUrl}/user/signup`,
    method: "post",
  },
  login: {
    url: `${baseUrl}/user/login`,
    method: "post",
  },
  sendUserVerificationOtp:{
    url: `${baseUrl}/user/sendUserVerificationOtp`,
    method: "post",
  },
  otpVerification:{
  url: `${baseUrl}/user/otpVerification`,
    method: "post",
  }

};


export default SummaryApi