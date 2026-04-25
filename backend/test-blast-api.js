const jwt = require('jsonwebtoken');
const axios = require('axios');

const token = jwt.sign({ id: 2 }, '43b57e910d10740fe54cd92b0657179e2c84ff2d3bb3389ef6f5814c4d972c7ea6430f14b22178ff25bb281e88eae94b076a1a60b797fb630e1a54639799e95b', { expiresIn: '1h' });

axios.post('http://localhost:3000/api/whatsapp/blast', {
  deviceId: 15,
  speed: 'fast'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => console.log(res.data)).catch(err => console.error(err?.response?.data || err));
