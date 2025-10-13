require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Queue Management System API');
});

// API routes
const tokenRoutes = require('./routes/tokens');
const cameraRoutes = require('./routes/camera');

app.use('/api/token', tokenRoutes);
app.use('/api/camera', cameraRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app, supabase };
