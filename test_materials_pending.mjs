import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/materials-pending-approval',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Response status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`\n✅ Materials pending approval: ${result.materials.length} items\n`);
      if (result.materials.length > 0) {
        result.materials.slice(0, 3).forEach(m => {
          console.log(`  📦 ${m.name} (${m.code})`);
          console.log(`     Shop: ${m.shop_id}, Rate: ${m.rate} ${m.unit}, Approved: ${m.approved}`);
        });
        if (result.materials.length > 3) {
          console.log(`  ... and ${result.materials.length - 3} more`);
        }
      } else {
        console.log('No materials pending approval found');
      }
    } catch (e) {
      console.error('Error parsing JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error:`, e.message);
  console.error(e);
});

req.end();
