import UserService from './../../service/user-service.js';

class UserController {
    constructor() {
        this.registration = this.registration.bind(this);
        this.authorization = this.authorization.bind(this);
        this.getUsers = this.getUsers.bind(this);
    }

    async test1(req, res, next) {
        return res.json({'nah': 'go'});
    }

    async registration (req, res, next){
        try{
            const {login, password} = req.body;
            const userData = await UserService.registration(login, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            return res.json(userData);
        } catch (e){
            next(e);
        }
    }

    async authorization (req, res, next){
        try{
            const {login, password} = req.body;
            const userData = await UserService.authorization(login, password, next);
            res.cookie('mz_refreshToken', userData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true});
            res.status(200).json(userData.client);         
        } catch (e){
            next(e);
        }
    }

    async getUsers (req, res, next){
        try{

        } catch (e){
            next(e);
        }
    }
}

export default new UserController();