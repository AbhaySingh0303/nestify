const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'ApiTest',
      email: `api${Date.now()}@test.com`,
      password: 'test',
      role: 'admin'
    });
    console.log(res.data);
  } catch (error) {
    console.error("HTTP Status:", error.response?.status);
    console.error("Response Data:", error.response?.data);
  }
}

test();
