async function verifyApi() {
  const targetUrl = 'http://127.0.0.1:3000/api/health';
  console.log(`Probing ${targetUrl}...`);

  try {
    const response = await fetch(targetUrl);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    console.log('Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    const body = await response.text();
    console.log('\nBody:');
    console.log(body);
    
    if (response.ok) {
      console.log('\n✅ API probe successful.');
    } else {
      console.log('\n❌ API probe failed.');
    }
  } catch (error) {
    console.error('\n❌ Network error or connection refused:');
    console.error(error);
  }
}

verifyApi();
