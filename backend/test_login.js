const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@nestify.com',
      password: '123456'
    });
    console.log("LOGIN SUCCESS! Token length:", res.data.token.length);
  } catch (error) {
    console.error("LOGIN FAIL:", error.response?.data?.message || 'Error');
  }
}
test();
