const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let testUserEmail = `testuser_${Date.now()}@example.com`;
let testUserId = '';

async function testFlow() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@wms.com', // Assuming this exists or using a known admin
      password: 'password123'
    });
    adminToken = loginRes.data.token;
    console.log('Admin logged in.');

    console.log(`2. Registering new worker: ${testUserEmail}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Worker',
      email: testUserEmail,
      password: 'password123',
      religion: 'Testing',
      religiousRestDay: 'Saturday'
    });
    console.log('Registration response:', regRes.data.message);

    console.log('3. Attempting to login as unverified worker...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testUserEmail,
        password: 'password123'
      });
    } catch (err) {
      console.log('Login blocked as expected:', err.response.data.error);
    }

    console.log('4. Checking pending registrations as admin...');
    const pendingRes = await axios.get(`${API_URL}/onboarding/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const testUser = pendingRes.data.find(u => u.email === testUserEmail);
    if (!testUser) throw new Error('Test user not found in pending list');
    testUserId = testUser._id;
    console.log('Test user found in pending list.');

    console.log('5. Verifying worker...');
    const shiftsRes = await axios.get(`${API_URL}/shifts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const shiftId = shiftsRes.data[0]._id;

    const verifyRes = await axios.post(`${API_URL}/onboarding/verify`, {
      userId: testUserId,
      role: 'worker',
      department: 'Testing Dept',
      position: 'QA Engineer',
      shiftId: shiftId,
      annualLeave: 25,
      sickLeave: 12,
      phoneNumber: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Verification successful:', verifyRes.data.message);

    console.log('6. Logging in as verified worker...');
    const workerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUserEmail,
      password: 'password123'
    });
    console.log('Worker logged in successfully. Token received.');

    console.log('7. Final check: Employee record exists...');
    const empRes = await axios.get(`${API_URL}/employees/${workerLoginRes.data.user.employeeId}`, {
      headers: { Authorization: `Bearer ${workerLoginRes.data.token}` }
    });
    console.log('Employee record verified:', empRes.data.name, empRes.data.department);

    console.log('FLOW VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

testFlow();
