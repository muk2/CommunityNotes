const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Client } = require('elasticsearch');
const { auth } = require('express-oauth2-jwt-bearer');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = 8080;

const esClient = new Client({
  host: 'https://elastic:GZVNoSSGtbP1=QtM2Qq9@localhost:9200'
});

app.use(cors());
app.use(express.json());

const jwtCheck = auth({
  audience: 'note',
  issuerBaseURL: 'https://dev-rhdcqgjj6fdxl6ns.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

app.get('/', (req, res) => {
  res.send('Hello from index route');
});

app.get('/notes', jwtCheck, async (req, res) => {
  try {
    const notes = await esClient.search({
      index: 'notes',
      body: {
        query: {
          bool: {
            should: [
              { match: { visibility: 'public' } }
            ]
          }
        }
      }
    });
    res.send(notes.hits.hits.map(hit => ({ id: hit._id, ...hit._source })));
  } catch (error) {
    console.error("Error fetching notes:", error);  // Log error for more insight
    res.status(500).send("Error fetching notes");
  }
});

// POST /notes: Add note with user ID and visibility status
app.post('/notes', jwtCheck, async (req, res) => {
  const { content, visibility } = req.body;
  const userId = req.auth.sub;  // Extract user ID from JWT token
  try {
    await esClient.index({
      index: 'notes',
      body: { content, userId, visibility }
    });
    res.send({ message: "Note added successfully" });
  } catch (error) {
    res.status(500).send("Error submitting note");
  }
});

// DELETE /notes/:id: Allow deletion only by note owner
app.delete('/notes/:id', jwtCheck, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.auth.sub;
  try {
    const note = await esClient.get({ index: 'notes', id: noteId });
    if (note._source.userId === userId) {
      await esClient.delete({ index: 'notes', id: noteId });
      res.send({ message: "Note deleted successfully" });
    } else {
      res.status(403).send("Unauthorized to delete this note");
    }
  } catch (error) {
    res.status(500).send("Error deleting note");
  }
});

http.createServer(app).listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});