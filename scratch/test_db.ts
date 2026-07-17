import postgres from 'postgres';

const client = postgres('postgresql://postgres:aoEOBFe9CEhWWLIg@db.dwjddjndeaqxlaqynjsy.supabase.co:5432/postgres', { prepare: false, connect_timeout: 10 });

async function test() {
  try {
    console.log("Attempting to connect to Supabase port 5432...");
    const res = await client`SELECT 1`;
    console.log("Connection successful!", res);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.end();
  }
}
test();
