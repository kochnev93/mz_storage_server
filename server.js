import express from 'express';
import path from 'path';
import serverRoutes from './routes/routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authMiddleware from './middleware/auth-middleware.js';
import errorMiddleware from './middleware/error-middleware.js';




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', serverRoutes);
//app.use(authMiddleware);
app.use(errorMiddleware);

const start = async () => {
  try{
    app.listen(PORT, () => {
      console.log(`Server has been started on port ${PORT}...`);
    });
  } catch (e){
    console.log (e);
  }
}

start();