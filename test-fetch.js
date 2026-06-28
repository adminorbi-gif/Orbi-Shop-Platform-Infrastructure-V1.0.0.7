async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/v1/search/popular");
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("HEADERS:", res.headers);
    console.log("BODY:", text.substring(0, 200));
  } catch(e) {
    console.log("FETCH ERROR:", e);
  }
}
test();
