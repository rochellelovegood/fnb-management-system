import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read and execute SQL files in order
const fs = await import('fs').then(m => m.promises);
const path = await import('path').then(m => m.default);

const scripts = [
  '01_users.sql',
  '02_products.sql',
  '03_ingredients.sql',
  '04_inventory.sql',
  '05_production.sql',
  '06_sales.sql',
  '07_forecasting.sql',
  '08_supplier_compliance.sql'
];

async function executeScript(filename) {
  try {
    const filepath = path.join(process.cwd(), 'scripts', filename);
    const sql = await fs.readFile(filepath, 'utf-8');
    
    console.log(`\n📝 Executing ${filename}...`);
    const { error } = await supabase.rpc('sql_execute', { query: sql });
    
    if (error) {
      console.error(`❌ Error in ${filename}:`, error);
      return false;
    }
    
    console.log(`✅ ${filename} completed`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to execute ${filename}:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting F&B ERP Database Setup...\n');
  
  for (const script of scripts) {
    const success = await executeScript(script);
    if (!success) {
      console.error(`\n⚠️ Setup incomplete - failed at ${script}`);
      break;
    }
  }
  
  console.log('\n✨ Database setup complete!');
}

main().catch(console.error);
