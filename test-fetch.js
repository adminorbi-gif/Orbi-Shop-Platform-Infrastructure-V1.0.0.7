async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/v1/messages");
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text.substring(0, 500));
  } catch(e) {
    console.log("FETCH ERROR:", e);
  }
}
test();
