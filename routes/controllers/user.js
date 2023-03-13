
import UserService from './../../service/user-service.js';
import jwt_decode from 'jwt-decode';

class UserController {
    constructor() {
        this.registration = this.registration.bind(this);
        this.authorization = this.authorization.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.blockUser = this.blockUser.bind(this);
        this.unlockUser = this.unlockUser.bind(this);
    }

    async test1(req, res, next) {
        return res.json({'nah': 'go'});
    }

    async registration (req, res, next){
        try{
            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt_decode(token);
            const id_author = decode.id;

            const userData = await UserService.registration(req.body.user, next);
            
            addLog(`Пользователь (id: ${id_author}) добавил нового пользователя: \n ${JSON.stringify(req.body.user)} \n`);

            return res.json(userData);
        } catch (e){
            next(e);
        }
    }

    async authorization (req, res, next){
        try{
            const {login, password} = req.body;
            const userData = await UserService.authorization(login, password, next);
            console.log(userData.client)
            res.cookie('mz_refreshToken', userData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true});
            res.status(200).json({data: userData.client});         
        } catch (e){
            next(e);
        }
    }

    async getUsers (req, res, next){
        try{
            const users = await UserService.getUsers(next)
            res.status(200).json({data: users}); 
        } catch (e){
            next(e); 
        }
    }


    async updateUser (req, res, next){
        try{

            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt_decode(token);
            const id_author = decode.id;

            const tempUser = req.body
            const user = await UserService.updateUser(tempUser, next)
            
            addLog(`Пользователь (id: ${id_author}) обновил пользователя (id: ${tempUser.id}): \n ${JSON.stringify(tempUser)} \n`);
            res.status(200).json({data: 'Пользователь обновлен'}); 
        } catch (e){
            next(e);
        }
    }


    async blockUser (req, res, next){
        try{
            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt_decode(token);
            const id_author = decode.id;

            const id = req.params.id;
            const user = await UserService.blockUser(id, next)

            addLog(`Пользователь (id: ${id_author}) заблокировал пользователя (id: ${id})\n`);
            res.status(200).json({data: 'Пользователь заблокирован'}); 
        } catch (e){
            next(e);
        }
    }


    async unlockUser (req, res, next){
        try{
            const token = req.headers.authorization.split(' ')[1];
            const decode = jwt_decode(token);
            const id_author = decode.id;

            const id = req.params.id;
            const user = await UserService.unlockUser(id, next)

            addLog(`Пользователь (id: ${id_author}) разблокировал пользователя (id: ${id})\n`);
            res.status(200).json({data: 'Пользователь разблокирован'}); 
        } catch (e){
            next(e);
        }
    }

    // async getUsers (req, res, next){
    //     try{
    //         const users = await UserService.getUsers(next)
    //         res.status(200).json({data: users}); 
    //     } catch (e){
    //         next(e);
    //     }
    // }
}

export default new UserController();