import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jymrhhlwdbclctobhbsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjc2NzEsImV4cCI6MjA0OTYwMzY3MX0.aAGN3jLnpCjNOw7-J3Lp4iQBbwMT9X6kMzgRgQtYz7E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed crops
    console.log('📊 Seeding crops...');
    const crops = [
      {
        name: 'Wheat',
        name_ar: 'قمح',
        category: 'grains',
        growing_season: 'winter',
        water_requirements: 'moderate',
        soil_requirements: 'well-drained loamy soil',
        climate_requirements: 'cool, dry climate',
        planting_depth_cm: 3,
        spacing_cm: 15,
        days_to_maturity: 120,
        optimal_ph_min: 6.0,
        optimal_ph_max: 7.5
      },
      {
        name: 'Tomato',
        name_ar: 'طماطم',
        category: 'vegetables',
        growing_season: 'spring',
        water_requirements: 'high',
        soil_requirements: 'rich, well-drained soil',
        climate_requirements: 'warm, humid climate',
        planting_depth_cm: 1,
        spacing_cm: 60,
        days_to_maturity: 80,
        optimal_ph_min: 6.0,
        optimal_ph_max: 6.8
      },
      {
        name: 'Olive',
        name_ar: 'زيتون',
        category: 'fruits',
        growing_season: 'year-round',
        water_requirements: 'low',
        soil_requirements: 'well-drained, rocky soil',
        climate_requirements: 'Mediterranean climate',
        planting_depth_cm: 0,
        spacing_cm: 600,
        days_to_maturity: 1825, // 5 years
        optimal_ph_min: 6.5,
        optimal_ph_max: 8.0
      },
      {
        name: 'Lettuce',
        name_ar: 'خس',
        category: 'vegetables',
        growing_season: 'spring',
        water_requirements: 'moderate',
        soil_requirements: 'fertile, well-drained soil',
        climate_requirements: 'cool climate',
        planting_depth_cm: 0.5,
        spacing_cm: 20,
        days_to_maturity: 45,
        optimal_ph_min: 6.0,
        optimal_ph_max: 7.0
      },
      {
        name: 'Barley',
        name_ar: 'شعير',
        category: 'grains',
        growing_season: 'winter',
        water_requirements: 'low',
        soil_requirements: 'well-drained soil',
        climate_requirements: 'cool, dry climate',
        planting_depth_cm: 2.5,
        spacing_cm: 12,
        days_to_maturity: 90,
        optimal_ph_min: 6.0,
        optimal_ph_max: 7.8
      }
    ];

    const { data: cropsData, error: cropsError } = await supabase
      .from('crops')
      .insert(crops)
      .select();

    if (cropsError) {
      console.error('Error seeding crops:', cropsError);
    } else {
      console.log(`✅ Successfully seeded ${cropsData.length} crops`);
    }

    // 2. Seed sample market prices
    console.log('💰 Seeding market prices...');
    if (cropsData && cropsData.length > 0) {
      const marketPrices = [];
      
      cropsData.forEach(crop => {
        // Generate 30 days of sample price data
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          const basePrice = crop.name === 'Wheat' ? 2.5 : 
                           crop.name === 'Tomato' ? 3.2 :
                           crop.name === 'Olive' ? 12.5 :
                           crop.name === 'Lettuce' ? 4.0 : 2.0;
          
          const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
          const price = basePrice * (1 + variation);
          
          marketPrices.push({
            crop_id: crop.id,
            price_per_kg: Math.round(price * 100) / 100,
            market_location: i % 3 === 0 ? 'Tunis' : i % 3 === 1 ? 'Sfax' : 'Sousse',
            price_date: date.toISOString().split('T')[0],
            quality_grade: i % 4 === 0 ? 'premium' : i % 4 === 1 ? 'standard' : 'economy',
            source: 'market_data'
          });
        }
      });

      const { data: pricesData, error: pricesError } = await supabase
        .from('market_prices')
        .insert(marketPrices);

      if (pricesError) {
        console.error('Error seeding market prices:', pricesError);
      } else {
        console.log(`✅ Successfully seeded ${marketPrices.length} market prices`);
      }
    }

    // 3. Create demo users (these will need to be created through Supabase Auth)
    console.log('👥 Demo users info:');
    const demoUsers = [
      {
        email: 'farmer@demo.com',
        role: 'farmer',
        full_name: 'Ahmed Al-Masri',
        full_name_ar: 'أحمد المصري'
      },
      {
        email: 'agronomist@demo.com',
        role: 'agronomist',
        full_name: 'Dr. Fatima Ben Ali',
        full_name_ar: 'د. فاطمة بن علي'
      },
      {
        email: 'admin@demo.com',
        role: 'admin',
        full_name: 'Mohamed Trabelsi',
        full_name_ar: 'محمد الطرابلسي'
      }
    ];

    console.log('Demo users to be created through Supabase Auth:');
    demoUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ${user.full_name_ar}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Create demo user accounts through Supabase Auth Dashboard');
    console.log('2. Test the application with real data');
    console.log('3. Verify API endpoints are working with Supabase');

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  }
}

// Run the seeding
seedDatabase();
