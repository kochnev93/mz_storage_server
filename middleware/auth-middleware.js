import jwt from 'jsonwebtoken';
import ApiError from '../exceptions/api-error.js';

export default async function (req, res, next) {
  try {
    if(!req.headers.authorization){
      throw ApiError.Unauthorized('Не авторизован');
    }

    const token = req.headers.authorization.split(' ')[1];
    console.log(token);
    
    if (!token) {
      throw ApiError.Unauthorized('Не авторизован');
    }

    const decoded = await jwt.verify(token, process.env.JWT_ACCESS_SECRET, function (err, decode){
      if(err){
        throw ApiError.Unauthorized('Не валидный токен');
      }
    });

    next();

  } catch (err) {
    next(err);
  }
}
