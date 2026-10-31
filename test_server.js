const http = require('http');

async function runTests() {
  const app = require('./app');
  
  // Wait a moment for DB and server to start
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  console.log('Testing server at:', baseUrl);

  // Helper fetch function using built-in fetch
  const testGet = async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    const data = await res.json();
    return { status: res.status, data };
  };

  // 1. Test Root
  const rootRes = await testGet('/');
  console.log('1. GET / status:', rootRes.status, 'Message:', rootRes.data.message);
  if (rootRes.status !== 200) throw new Error('Root route failed');

  // 2. Test Health
  const healthRes = await testGet('/health');
  console.log('2. GET /health status:', healthRes.status, 'Data:', healthRes.data);
  if (healthRes.status !== 200) throw new Error('Health check failed');

  // 3. Test GET /books
  const booksRes = await testGet('/books');
  console.log('3. GET /books status:', booksRes.status, 'Count:', booksRes.data.length);
  if (booksRes.status !== 200 || !Array.isArray(booksRes.data)) throw new Error('GET /books failed');

  // 4. Test GET /books/ (trailing slash)
  const booksSlashRes = await testGet('/books/');
  console.log('4. GET /books/ status:', booksSlashRes.status, 'Count:', booksSlashRes.data.length);
  if (booksSlashRes.status !== 200) throw new Error('GET /books/ failed');

  // 5. Test GET /books/1
  const bookRes = await testGet('/books/1');
  console.log('5. GET /books/1 status:', bookRes.status, 'Book Title:', bookRes.data.title);
  if (bookRes.status !== 200 || !bookRes.data.title) throw new Error('GET /books/1 failed');

  // 6. Test POST /books
  const postRes = await fetch(`${baseUrl}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Deploy Test Book',
      author: 'Test Author',
      price: 199,
      pages: 150
    })
  });
  const newBook = await postRes.json();
  console.log('6. POST /books status:', postRes.status, 'New Book ID:', newBook.id);
  if (postRes.status !== 201 || !newBook.id) throw new Error('POST /books failed');

  // 7. Test PUT /books/:id
  const putRes = await fetch(`${baseUrl}/books/${newBook.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Deploy Test Book Updated',
      author: 'Test Author Updated',
      price: 249,
      pages: 160
    })
  });
  const putData = await putRes.json();
  console.log('7. PUT /books/:id status:', putRes.status, 'Message:', putData.message);
  if (putRes.status !== 200) throw new Error('PUT /books failed');

  // 8. Test DELETE /books/:id
  const delRes = await fetch(`${baseUrl}/books/${newBook.id}`, {
    method: 'DELETE'
  });
  const delData = await delRes.json();
  console.log('8. DELETE /books/:id status:', delRes.status, 'Message:', delData.message);
  if (delRes.status !== 200) throw new Error('DELETE /books failed');

  // 9. Test 404
  const notFoundRes = await testGet('/unknown-route');
  console.log('9. GET /unknown-route status:', notFoundRes.status);
  if (notFoundRes.status !== 404) throw new Error('404 handling failed');

  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
