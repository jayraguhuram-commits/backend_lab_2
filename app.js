const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "database", "books.db");

let db;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });

        // Use Render's environment PORT, or fallback to 3000 for local development
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

// GET all books
app.get("/books/", async (request, response) => {
    try {
        const books = await db.all("SELECT * FROM book");
        response.status(200).json(books);
    } catch (error) {
        response.status(500).json({ error: "Failed to retrieve books" });
    }
});

// GET one book
app.get("/books/:bookId/", async (request, response) => {
    try {
        const { bookId } = request.params;
        const book = await db.get("SELECT * FROM book WHERE id = ?", bookId);

        if (!book) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json(book);
    } catch (error) {
        response.status(500).json({ error: "Failed to retrieve book" });
    }
});

// POST a book
app.post("/books/", async (request, response) => {
    try {
        const { title, author, price, pages } = request.body;

        if (!title || !author || price == null || pages == null) {
            return response.status(400).json({
                error: "title, author, price, and pages are required",
            });
        }

        const result = await db.run(
            "INSERT INTO book (title, author, price, pages
