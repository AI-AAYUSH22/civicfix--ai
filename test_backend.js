const fs = require('fs');

async function run() {
  console.log("Fetching analyze-photo...");
  try {
    const formData = new FormData();
    // we need to send a dummy image to see how it responds.
    // wait, we don't have the dinosaur image. Let's just create a dummy black image.
    // actually, let's just make a POST request with an invalid image.
    const blob = new Blob(["invalid data"], { type: 'image/jpeg' });
    formData.append('photo', blob, 'test.jpg');
    
    const res = await fetch('http://localhost:8000/api/v1/cases/analyze-photo', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (e) {
    console.error(e);
  }
}
run();
