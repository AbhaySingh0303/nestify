const axios = require('axios');

async function test() {
  try {
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'GetRoomsTester',
      email: `tester${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin'
    });
    
    const token = regRes.data.token;
    console.log("Registered. Token length:", token.length);

    const roomsRes = await axios.get('http://localhost:5000/api/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Rooms fetched:", roomsRes.data.length);
  } catch (error) {
    console.error("HTTP Status:", error.response?.status);
    console.error("Response:", JSON.stringify(error.response?.data));
    console.error("Message:", error.message);
  }
}

test();
