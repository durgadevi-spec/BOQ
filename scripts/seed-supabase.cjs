const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const bcryptjs = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kfbquadkplnnqovsbnji:Durga%219Qx%407B%2325Lm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=allow'
});

async function seedDatabase() {
  try {
    console.log('Connecting to Supabase...');
    const client = await pool.connect();

    // Seed users
    console.log('\n--- Seeding users ---');
    const demoUsers = [
      { username: 'admin@example.com', password: 'DemoPass123!', role: 'admin' },
      { username: 'software@example.com', password: 'DemoPass123!', role: 'software_team' },
      { username: 'purchase@example.com', password: 'DemoPass123!', role: 'purchase_team' },
      { username: 'user@example.com', password: 'DemoPass123!', role: 'user' },
      { username: 'supplier@example.com', password: 'DemoPass123!', role: 'supplier' },
    ];

    for (const u of demoUsers) {
      const userId = randomUUID();
      const salt = bcryptjs.genSaltSync(10);
      const hashedPassword = bcryptjs.hashSync(u.password, salt);
      try {
        await client.query(
          'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
          [userId, u.username, hashedPassword, u.role]
        );
        console.log(`✓ Seeded user: ${u.username} (${u.role})`);
      } catch (err) {
        if (err.code === '23505') {
          console.log(`ℹ User already exists: ${u.username}`);
        } else {
          throw err;
        }
      }
    }

    // Seed shops
    console.log('\n--- Seeding shops ---');
    const demoShops = [
      {
        name: 'City Hardware',
        location: 'Downtown',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        pincode: '10001',
        phoneCountryCode: '+1',
        contactNumber: '2125551234',
        rating: 4.5,
        gstNo: 'GST123456789',
        categories: ['Fasteners', 'Tools', 'Safety Equipment']
      },
      {
        name: 'Builder\'s Haven',
        location: 'Midtown',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        pincode: '90001',
        phoneCountryCode: '+1',
        contactNumber: '2135559876',
        rating: 4.2,
        gstNo: 'GST987654321',
        categories: ['Lumber', 'Concrete', 'Paint']
      },
      {
        name: 'BuildMart Standard',
        location: 'Suburb',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        pincode: '60601',
        phoneCountryCode: '+1',
        contactNumber: '3125554567',
        rating: 4.0,
        gstNo: 'GST555666777',
        categories: ['Electrical', 'Plumbing', 'HVAC']
      }
    ];

    for (const shop of demoShops) {
      const shopId = randomUUID();
      try {
        await client.query(
          `INSERT INTO shops (id, name, location, city, state, country, pincode, phonecountrycode, contactnumber, rating, gstno, categories)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            shopId,
            shop.name,
            shop.location,
            shop.city,
            shop.state,
            shop.country,
            shop.pincode,
            shop.phoneCountryCode,
            shop.contactNumber,
            shop.rating,
            shop.gstNo,
            JSON.stringify(shop.categories)
          ]
        );
        console.log(`✓ Seeded shop: ${shop.name} (${shopId})`);

        // Seed materials for this shop
        const materials = [
          {
            name: 'Stainless Steel Bolt M10',
            code: `MAT-${Math.random().toString(36).substring(7).toUpperCase()}`,
            rate: 5.5,
            unit: 'piece',
            category: 'Fasteners',
            brandName: 'XYZ Brand',
            modelNumber: 'M10-SS',
            subCategory: 'Bolts',
            technicalSpecification: 'Grade A4, DIN 933'
          },
          {
            name: 'Hydraulic Cement',
            code: `MAT-${Math.random().toString(36).substring(7).toUpperCase()}`,
            rate: 450.0,
            unit: 'bag',
            category: 'Concrete',
            brandName: 'TechCement',
            modelNumber: 'HC-50KG',
            subCategory: 'Cement',
            technicalSpecification: '50kg bag, 28 day strength'
          },
          {
            name: 'Industrial Paint',
            code: `MAT-${Math.random().toString(36).substring(7).toUpperCase()}`,
            rate: 800.0,
            unit: 'litre',
            category: 'Paint',
            brandName: 'Premium Paints',
            modelNumber: 'IP-1000',
            subCategory: 'Exterior Paint',
            technicalSpecification: 'Weather resistant, UV protected'
          }
        ];

        for (const mat of materials) {
          const matId = randomUUID();
          try {
            await client.query(
              `INSERT INTO materials (id, name, code, rate, shop_id, unit, category, brandname, modelnumber, subcategory, technicalspecification, approved, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())`,
              [
                matId,
                mat.name,
                mat.code,
                mat.rate,
                shopId,
                mat.unit,
                mat.category,
                mat.brandName,
                mat.modelNumber,
                mat.subCategory,
                mat.technicalSpecification,
                false  // Set approved to false so materials must be explicitly approved
              ]
            );
            console.log(`  ✓ Seeded material: ${mat.name} (pending approval)`);
          } catch (err) {
            if (err.code !== '23505') {
              console.error(`  ✗ Error seeding material ${mat.name}:`, err.message);
            }
          }
        }
      } catch (err) {
        if (err.code === '23505') {
          console.log(`ℹ Shop already exists: ${shop.name}`);
        } else {
          console.error(`✗ Error seeding shop ${shop.name}:`, err.message);
        }
      }
    }

    console.log('\n✅ Seeding complete!');
    client.release();
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(err => { console.error(err); process.exit(1); });
