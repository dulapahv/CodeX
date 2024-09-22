import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://occp.dulapahv.dev',
  'https://dev-occp.dulapahv.dev',
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Hello from occp-server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
