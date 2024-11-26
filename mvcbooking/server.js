const express = require('express');
const fs = require('fs/promises');
const formidable = require('express-formidable');
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 10000; // Use the PORT environment variable or default to 10000

// Middleware
app.use(formidable());

// MongoDB setup
const mongourl = 'mongodb+srv://fordpiggy1:631012chung@cluster123.iyqhy.mongodb.net/?retryWrites=true&w=majority&appName=cluster123'; // Replace with your MongoDB connection string
const client = new MongoClient(mongourl);
const dbName = 'cluster123';
const collectionName = "bookings";

// Views
app.set('view engine', 'ejs');

// Helper functions for database operations
const findDocument = async (db, criteria) => {
    const collection = db.collection(collectionName);
    return await collection.find(criteria).toArray();
};

const updateDocument = async (db, criteria, updateDoc) => {
    const collection = db.collection(collectionName);
    return await collection.updateOne(criteria, { $set: updateDoc });
};

// Route handlers
const handle_Find = async (res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const docs = await findDocument(db, criteria);
        res.status(200).render('list', { nBookings: docs.length, bookings: docs });
    } catch (error) {
        console.error("Error finding documents:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
};

const handle_Details = async (res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const DOCID = { '_id': new ObjectId(criteria._id) };
        const docs = await findDocument(db, DOCID);
        res.status(200).render('details', { booking: docs[0] });
    } catch (error) {
        console.error("Error retrieving details:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
};

const handle_Edit = async (res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const DOCID = { '_id': new ObjectId(criteria._id) };
        const docs = await findDocument(db, DOCID);
        res.status(200).render('edit', { booking: docs[0] });
    } catch (error) {
        console.error("Error retrieving edit data:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
};

const handle_Update = async (req, res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const DOCID = { '_id': new ObjectId(req.fields._id) };
        const updateDoc = {
            bookingid: req.fields.bookingid,
            mobile: req.fields.mobile,
        };

        if (req.files.filetoupload && req.files.filetoupload.size > 0) {
            const data = await fs.readFile(req.files.filetoupload.path, { encoding: 'base64' });
            updateDoc.photo = Buffer.from(data);
        }

        const results = await updateDocument(db, DOCID, updateDoc);
        res.status(200).render('info', { message: `Updated ${results.modifiedCount} document(s)` });
    } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
};

// Routes
app.get('/', (req, res) => {
    res.redirect('/find');
});

app.get('/find', (req, res) => {
    handle_Find(res, req.query.docs);
});

app.get('/details', (req, res) => {
    handle_Details(res, req.query);
});

app.get('/edit', (req, res) => {
    handle_Edit(res, req.query);
});

app.post('/update', (req, res) => {
    handle_Update(req, res, req.query);
});

app.get('/*', (req, res) => {
    res.status(404).render('info', { message: `${req.path} - Unknown request!` });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
