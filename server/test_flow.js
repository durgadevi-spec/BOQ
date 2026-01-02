(async function(){
  try {
    const base = 'http://localhost:5000';
    console.log('Logging in as admin...');
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@example.com', password: 'DemoPass123!' })
    });
    const loginJson = await loginRes.json();
    console.log('LOGIN:', loginJson);
    const token = loginJson.token;
    if (!token) { console.error('No token obtained; aborting'); process.exit(2); }

    console.log('Creating shop...');
    const shopBody = {
      name: 'AutoTest Shop ' + Date.now(),
      location: 'AutoLoc',
      city: 'AutoCity',
      state: 'AC',
      country: 'USA',
      pincode: '99999',
      phoneCountryCode: '+1'
    };
    const createRes = await fetch(base + '/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(shopBody)
    });
    const createJson = await createRes.json();
    console.log('CREATE:', createRes.status, createJson);

    console.log('Fetching pending shops...');
    const pendRes = await fetch(base + '/api/shops-pending-approval', { headers: { 'Authorization': 'Bearer ' + token } });
    const pendJson = await pendRes.json();
    console.log('PENDING:', pendJson);

    const found = (pendJson.shops || []).find(s => (s.shop && s.shop.name && s.shop.name.startsWith('AutoTest Shop')) || s.name && s.name.startsWith('AutoTest Shop'));
    if (!found) { console.error('Created pending shop not found in pending list'); process.exit(3); }
    const id = found.shop?.id || found.id;
    console.log('Approving shop id=', id);
    const approveRes = await fetch(base + `/api/shops/${id}/approve`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    const approveJson = await approveRes.json();
    console.log('APPROVE:', approveRes.status, approveJson);

    console.log('Fetching public shops...');
    const publicRes = await fetch(base + '/api/shops');
    const publicJson = await publicRes.json();
    console.log('PUBLIC:', publicJson.shops.find(s => s.name && s.name.startsWith('AutoTest Shop')) );

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
