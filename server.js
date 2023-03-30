import express from 'express';
import path from 'path';
import serverRoutes from './routes/routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authMiddleware from './middleware/auth-middleware.js';
import errorMiddleware from './middleware/error-middleware.js';
import fileUpload from 'express-fileupload';



dotenv.config();
let secret = 'qwerty';

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.json());
app.use(cookieParser(secret));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use('/api', serverRoutes);
app.use(authMiddleware);
app.use(errorMiddleware);
app.use(fileUpload({
  createParentPath: true
}))


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