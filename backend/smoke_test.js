const axios = require('axios');
const API = 'http://localhost:5000/api';

async function runSmokeTests() {
  console.log('--- Starting Smoke Tests ---');
  let token = '';
  let tenantToken = '';
  let testRoomId = '';
  let testTenantId = '';
  let adminId = '';

  try {
    // 1. Authentication
    console.log('[TEST] Register new admin...');
    const randAdmin = `smokeadmin${Date.now()}@test.com`;
    await axios.post(`${API}/auth/register`, { name: 'SmokeAdmin', email: randAdmin, password: 'password123', role: 'admin' });

    console.log('[TEST] Login admin...');
    const adminLogin = await axios.post(`${API}/auth/login`, { email: randAdmin, password: 'password123' });
    token = adminLogin.data.token;
    adminId = adminLogin.data._id;
    console.log('✅ Admin Login successful.');

    console.log('[TEST] Register new tenant...');
    const randEmail = `smoke${Date.now()}@test.com`;
    await axios.post(`${API}/auth/register`, { name: 'SmokeTenant', email: randEmail, password: 'password123', role: 'tenant' });
    
    console.log('[TEST] Login tenant...');
    const tenantLogin = await axios.post(`${API}/auth/login`, { email: randEmail, password: 'password123' });
    tenantToken = tenantLogin.data.token;
    console.log('✅ Tenant Login successful.');

    // 2. Rooms
    console.log("✅ Create PG");
    const roomRes = await axios.post(`${API}/rooms`, { roomNumber: 'Smoke101', capacity: 2, rent: 5000, amenities: ['WiFi'] }, { headers: { Authorization: `Bearer ${token}` } });
    roomId = roomRes.data._id;
    console.log('✅ Room created.');

    // 3. Tenant Management
    console.log('[TEST] Admin Add Tenant to Room...');
    // We create tenant profile linked to the user account
    const tenantRes = await axios.post(`${API}/tenants`, { userId: tenantLogin.data._id, roomId: roomId, contactNumber: '1234567890' }, { headers: { Authorization: `Bearer ${token}` } });
    testTenantId = tenantRes.data._id;
    console.log('✅ Tenant added to room.');

    console.log('[TEST] Fetch Tenants...');
    const fetchTenants = await axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } });
    if (!fetchTenants.data.length) throw new Error('Tenants list empty');
    console.log('✅ Tenants fetched successfully.');

    // 4. Payments
    console.log('[TEST] Admin Creates Payment Record...');
    const payRes = await axios.post(`${API}/payments`, { tenantId: testTenantId, amount: 5000, month: 'Nov 2023', status: 'Pending' }, { headers: { Authorization: `Bearer ${token}` } });
    const paymentId = payRes.data._id;
    
    console.log('[TEST] Tenant Marks Payment Paid...');
    await axios.put(`${API}/payments/${paymentId}`, { status: 'Paid' }, { headers: { Authorization: `Bearer ${tenantToken}` } });
    console.log('✅ Payment marked as paid.');

    console.log('[TEST] Fetch Payment History...');
    const fetchPay = await axios.get(`${API}/payments/my`, { headers: { Authorization: `Bearer ${tenantToken}` } });
    const isPaid = fetchPay.data.find(p => p._id === paymentId)?.status === 'Paid';
    if (!isPaid) throw new Error('Payment was not updated');
    console.log('✅ Payment history is correct.');

    // 5. Complaints
    console.log('[TEST] Tenant Raises Complaint...');
    const compRes = await axios.post(`${API}/complaints`, { title: 'Smoke AC Issue', description: 'AC not working' }, { headers: { Authorization: `Bearer ${tenantToken}` } });
    const complaintId = compRes.data._id;
    console.log('✅ Complaint raised.');

    console.log('[TEST] Admin Views and Resolves Complaint...');
    const fetchComp = await axios.get(`${API}/complaints`, { headers: { Authorization: `Bearer ${token}` } });
    if (!fetchComp.data.length) throw new Error('Complaints not visible');
    await axios.put(`${API}/complaints/${complaintId}/resolve`, {}, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Complaint resolved by admin.');

    // 6. Error Handling
    console.log('[TEST] Invalid token handling...');
    try {
      await axios.get(`${API}/rooms`, { headers: { Authorization: `Bearer invalid` } });
      throw new Error('Should have failed');
    } catch(err) {
      if (err.response?.status === 401) console.log('✅ Correctly handled 401 Unauthorized.');
      else throw new Error('Did not return 401 on invalid token');
    }

    console.log('--- All Smoke Tests Passed Successfully ---');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.response?.data || error.message);
    require('fs').writeFileSync('error.json', JSON.stringify(error.response?.data || error.message));
    process.exit(1);
  }
}

runSmokeTests();
