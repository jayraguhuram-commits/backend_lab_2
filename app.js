const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const databaseDir = path.join(__dirname, "database");
const databasePath = path.join(databaseDir, "books.db");

let db;

const initialBooks = [
    { title: "The Alchemist", author: "Paulo Coelho", price: 350, pages: 208 },
    { title: "Wings of Fire", author: "A. P. J. Abdul Kalam", price: 299, pages: 180 },
    { title: "Atomic Habits", author: "James Clear", price: 499, pages: 320 },
    { title: "The Hobbit", author: "J. R. R. Tolkien", price: 399, pages: 310 },
    { title: "1984", author: "George Orwell", price: 250, pages: 328 },
    { title: "Pride and Prejudice", author: "Jane Austen", price: 275, pages: 432 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 220, pages: 180 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", price: 325, pages: 281 },
    { title: "The Book Thief", author: "Markus Zusak", price: 450, pages: 584 },
    { title: "Ikigai", author: "Héctor García and Francesc Miralles", price: 299, pages: 208 }
];

const seedInitialBooksIfEmpty = async () => {
    const rowCount = await db.get("SELECT COUNT(*) as count FROM book");
    if (rowCount && rowCount.count === 0) {
        for (const book of initialBooks) {
            await db.run(
                "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
                book.title,
                book.author,
                book.price,
                book.pages
            );
        }
        console.log("Database seeded with default books.");
    }
};

const initializeDBAndServer = async () => {
    try {
        if (!fs.existsSync(databaseDir)) {
            fs.mkdirSync(databaseDir, { recursive: true });
        }

        db = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });

        // Ensure table exists on fresh deployments
        await db.run(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price INTEGER NOT NULL,
                pages INTEGER NOT NULL
            )
        `);

        await seedInitialBooksIfEmpty();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

// Root route
app.get("/", (request, response) => {
    response.status(200).json({
        message: "Welcome to Lab 2: SQLite database and CRUD routes API",
        status: "online",
        endpoints: {
            getAllBooks: "GET /books",
            getBookById: "GET /books/:bookId",
            addBook: "POST /books",
            updateBook: "PUT /books/:bookId",
            deleteBook: "DELETE /books/:bookId",
            healthCheck: "GET /health"
        }
    });
});

// Health check endpoint
app.get("/health", (request, response) => {
    response.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// GET all books (supports both /books and /books/)
app.get(["/books", "/books/"], async (request, response) => {
    try {
        const books = await db.all("SELECT * FROM book");
        response.status(200).json(books);
    } catch (error) {
        response.status(500).json({ error: "Failed to retrieve books" });
    }
});

// GET one book
app.get(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
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
app.post(["/books", "/books/"], async (request, response) => {
    try {
        const { title, author, price, pages } = request.body;

        if (!title || !author || price == null || pages == null) {
            return response.status(400).json({
                error: "title, author, price, and pages are required",
            });
        }

        const result = await db.run(
            "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
            title,
            author,
            price,
            pages
        );

        response.status(201).json({
            id: result.lastID,
            title,
            author,
            price,
            pages,
        });
    } catch (error) {
        response.status(500).json({ error: "Failed to add book" });
    }
});

// PUT a book
app.put(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
    try {
        const { bookId } = request.params;
        const { title, author, price, pages } = request.body;

        if (!title || !author || price == null || pages == null) {
            return response.status(400).json({
                error: "title, author, price, and pages are required",
            });
        }

        const result = await db.run(
            "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
            title,
            author,
            price,
            pages,
            bookId
        );

        if (result.changes === 0) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json({ message: "Book updated successfully" });
    } catch (error) {
        response.status(500).json({ error: "Failed to update book" });
    }
});

// DELETE a book
app.delete(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
    try {
        const { bookId } = request.params;

        const result = await db.run("DELETE FROM book WHERE id = ?", bookId);

        if (result.changes === 0) {
            return response.status(404).json({ error: "Book not found" });
        }

        response.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        response.status(500).json({ error: "Failed to delete book" });
    }
});

// 404 handler for unknown routes
app.use((request, response) => {
    response.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((error, request, response, next) => {
    console.error("Unhandled error:", error);
    response.status(500).json({ error: "Internal server error" });
});

module.exports = app;
