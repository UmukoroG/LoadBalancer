const express = require('express');
const cors = require('cors');
const {getAllData} = require('./query');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET', 
  allowedHeaders: 'Content-Type,Authorization', 
  credentials: true, 
}));

app.get('/download', async (req, res) => {//router to download all the data from the database
try {
    const data = await getAllData();
    res.json(data);
} catch (error) {
    console.error('Error downloading data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
  
  