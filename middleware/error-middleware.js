import ApiError from './../exceptions/api-error.js';

export default function (err, req, res, next){
    console.log(err);
    if(err instanceof ApiError){
        return res.status(err.status).json({errorMessage: err.message, errors: err.error});
    }
    return res.status(500).json({errorMessage: 'Ошибка сервера'})
}