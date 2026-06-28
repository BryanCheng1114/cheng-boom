async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/orders/cmqxscncc0002uy4oz6hqbd2q/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', message: 'Hello from script' })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error(err);
  }
}
test();
