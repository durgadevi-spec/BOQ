#!/usr/bin/env node

const API_URL = "http://localhost:5000/api";

// Get a token for the admin user
async function getAdminToken() {
  console.log('[test] Logging in as admin...');
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  
  if (!res.ok) {
    throw new Error('Failed to login as admin');
  }
  
  const data = await res.json();
  return data.token;
}

// Create material templates
async function createMaterialTemplates(token) {
  const templates = [
    { name: 'Industrial Paint', code: 'TPL-PAINT-001', category: 'Paint' },
    { name: 'Hydraulic Cement', code: 'TPL-CEMENT-001', category: 'Concrete' },
    { name: 'Stainless Steel Bolt M10', code: 'TPL-BOLT-M10', category: 'Fasteners' },
    { name: 'Wooden Door Frame', code: 'TPL-DOOR-001', category: 'Doors' },
    { name: 'Electrical Wire 2.5mm', code: 'TPL-WIRE-2.5', category: 'Electrical' },
    { name: 'PVC Pipe 50mm', code: 'TPL-PIPE-50', category: 'Plumbing' },
  ];

  for (const template of templates) {
    try {
      console.log(`[test] Creating template: ${template.name}...`);
      const res = await fetch(`${API_URL}/material-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(template)
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(`[test] Error: ${error.message}`);
        if (error.message.includes('already exists')) {
          console.log(`[test] Template already exists, skipping...`);
        }
        continue;
      }

      const data = await res.json();
      console.log(`✓ Created: ${data.template.name}`);
    } catch (err) {
      console.error(`[test] Failed to create ${template.name}:`, err.message);
    }
  }
}

async function main() {
  try {
    console.log('[test] Starting material template setup...');
    const token = await getAdminToken();
    console.log('[test] ✓ Got admin token');
    
    await createMaterialTemplates(token);
    
    console.log('[test] ✓ Material template setup complete');
  } catch (err) {
    console.error('[test] Error:', err.message);
    process.exit(1);
  }
}

main();
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('Testing Material Template Workflow\n');
    console.log('1. GET /api/material-templates (should be empty initially)');
    let res = await makeRequest('GET', '/api/material-templates');
    console.log(`   Status: ${res.status}`);
    console.log(`   Templates: ${res.body?.templates?.length || 0}`);

    console.log('\n2. Creating material templates...');
    for (const template of testTemplates) {
      res = await makeRequest('POST', '/api/material-templates', template, adminToken);
      console.log(`   ${template.name}: ${res.status}`);
      if (res.status === 201) {
        console.log(`     ✓ Created with code: ${res.body?.template?.code}`);
      }
    }

    console.log('\n3. GET /api/material-templates (should now have templates)');
    res = await makeRequest('GET', '/api/material-templates');
    console.log(`   Status: ${res.status}`);
    console.log(`   Templates found: ${res.body?.templates?.length || 0}`);
    res.body?.templates?.slice(0, 2).forEach(t => {
      console.log(`     - ${t.name} (${t.code})`);
    });

    console.log('\n✓ Material Template workflow test completed!');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

test();
