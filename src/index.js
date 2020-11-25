import express from 'express';
import { sequelize, models } from './models/index.js';

const app = express()
app.use(express.json());

//Get User Edpoint
app.get('/user', async function(req, res){
    const users = await models.User.findAll({attributes: {
        exclude: ['createdAt', 'updatedAt', 'userId', 'beneficiaryId', 'benefactorsId'],
    }})
    return res.send(users)
});

//GET User by ID 
app.get('/user/:user_id', async function(req, res){
    const user = await models.User.findByPk(req.params.user_id, {
        include:['beneficiaries', 'benefactors'],
    })
    if (user === null)
        return res.status(400).send({error:"User Error", messsage:'User does not exist'})
    const card = await  models.Card.findOne({where:{userId:user.id}})
    if (user.userType == '1') {
        const beneficiaries = user.beneficiaries.map(beneficiary => beneficiary.name)
        const beneficiariesIds = user.beneficiaries.map(beneficiary => beneficiary.id)
        return res.send({
            userId: user.id,
            name: user.name,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            userType: user.userType,
            cardNumber: card.cardNumber,
            expDate: card.expDate,
            beneficiaries: beneficiaries,
            beneficiariesIds: beneficiariesIds
        })
    }
    else if (user.userType == '2'){
        const benefactors = user.benefactors.map(benefactor => benefactor.name)
        const benefactorsIds = user.benefactors.map(benefactor => benefactor.id)
        return res.send({
            userId: user.id,
            name: user.name,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            userType: user.userType,
            cardNumber: card.cardNumber,
            expDate: card.expDate,
            benefactors: benefactors,
            benefactorsIds: benefactorsIds

        })
    }
})

//Delete user
app.delete('/user/:user_id', async function(req, res){
    const user = await models.User.findByPk(req.params.user_id)
    if (user === null)
        return res.status(400).send({error:"User Error", messsage:'User does not exist'})
    await models.User.destroy({where:{id:user.id}})
    return res.send({message:'Successfully deleted user'})
})

//Create User Endpoint
app.post('/user', async function(req, res){

    const name = req.body['name']
    const lastName = req.body['lastName']
    const phoneNumber = req.body['phoneNumber']
    const userType = req.body['userType']

    try{
        const user = await models.User.create({
            name: name,
            lastName: lastName,
            phoneNumber: phoneNumber,
            userType: userType
        })
        return res.send({user:user})
    } catch(err){
        //Cayching errors from model validation
        if (err.errors[0].type == 'unique violation')
            return res.status(400).send({error:"Unique Error", message:'Phone number already used'})
        else if (err.errors[0].type == 'notNull Violation')
            return res.status(400).send({error:"Incomplete Request", message:err.errors[0].message})
        else
            return res.status(400).send({error:"Validation Error", message:err.errors[0].message})
    }
});

//Create card related to user
app.post('/cards', async function(req, res){
    const userId = req.body['userId']
    const cardNumber = req.body['cardNumber']
    const expDate = req.body ['expDate']

    //Validate if user exists
    if (userId === undefined)
        return res.status(400).send({error:"Incomplete Request", messsage:'Missing arg userId'})
    else if (await models.User.findByPk(userId) === null)
        return res.status(400).send({error:"User Error", message:'User does not exist'})
    else {
        try{
            const card = await models.Card.create({
                userId: userId,
                cardNumber: cardNumber,
                expDate: expDate
            })
            return res.send({card:card})
        } catch(err){
            console.log(err)
            return res.status(400).send({error:"Validation Error", message:err.errors[0].message})
        }
    }

});

//Add beneficiary to benefactor
app.post('/beneficiaries', async function(req, res){
    const userId = req.body['userId']
    const beneficiaryPhoneNumber = req.body['beneficiaryPhoneNumber']

    if (userId === undefined)
        return res.status(400).send({error:"Incomplete Request", messsage:'Missing arg userId'})
    if (beneficiaryPhoneNumber === undefined)
        return res.status(400).send({error:"Incomplete Request", messsage:'Missing arg beneficiaryPhoneNumber'})

    //Validate if both exists
    const benefactor =  await models.User.findByPk(userId, {include: ['beneficiaries']})
    const beneficiary =  await models.User.findOne({where:{phoneNumber:beneficiaryPhoneNumber}, include:['benefactors']})

    if (benefactor === null)
        return res.status(400).send({error:"User Error", message:'User does not exist'})
    else if (benefactor.userType == '2')
        return res.status(400).send({error:"User Error", message:'This user is registered as beneficiary'})

    if (beneficiary === null)
        return res.status(400).send({error:"User Error", message:'User with this number does not exist'})
    else if (beneficiary.userType == '1')
        return res.status(400).send({error:"User Error", message:'This number is linked to a benefactor'})

    //Checamos si aún es posible agregar beneficiarios o benefacotres respectivamente
    if (benefactor.beneficiaries.length >= 2)
        return res.send({error:"Limit Number Error", message:"Is not possible to add a new beneficiary to this benefactor"})
    else if (beneficiary.benefactors.length >= 2)
        return res.send({error:"Limit Number Error", message:"Is not possible to add a new benefactor to this beneficiary"})

    benefactor.addBeneficiaries(beneficiary)
    beneficiary.addBenefactors(benefactor)
    console.log(await models.User.findByPk(userId, {include: ['beneficiaries']}))
    return res.send({message:'Successfully add beneficiary', benefiaryId:beneficiary.id, benefactorId:benefactor.id})
});

//Add benefactor to beneficiary
app.post('/benefactors', async function(req, res){
    const userId = req.body['userId']
    const benefactorPhoneNumber = req.body['benefactorPhoneNumber']

    if (userId === undefined)
        return res.status(400).send({error:"Incomplete Request", messsage:'Missing arg userId'})
    if (benefactorPhoneNumber === undefined)
        return res.status(400).send({error:"Incomplete Request", messsage:'Missing arg benefactorPhoneNumber'})
        
    //Validate if both exists
    const beneficiary =  await models.User.findByPk(userId, {include: ['benefactors']})
    const benefactor =  await models.User.findOne({where:{phoneNumber:benefactorPhoneNumber}, include:['beneficiaries']})

    if (beneficiary === null)
        return res.status(400).send({error:"User Error", message:'User does not exist'})
    else if (beneficiary.userType == '1')
        return res.status(400).send({error:"User Error", message:'This user is registered as benefactor'})

    if (benefactor === null)
        return res.status(400).send({error:"User Error", message:'User with this number does not exist'})
    else if (benefactor.userType == '2')
        return res.status(400).send({error:"User Error", message:'This number is linked to a beneficiary'})

    //Checamos si aún es posible agregar beneficiarios o benefacotres respectivamente
    if (benefactor.beneficiaries.length >= 2)
        return res.send({error:"Limit Number Error", message:"Is not possible to add a new beneficiary to this benefactor"})
    else if (beneficiary.benefactors.length >= 2)
        return res.send({error:"Limit Number Error", message:"Is not possible to add a new benefactor to this beneficiary"})

    benefactor.addBeneficiaries(beneficiary)
    beneficiary.addBenefactors(benefactor)
    return res.send({message:'Successfully add benefactor', benefiaryId:beneficiary.id, benefactorId:benefactor.id})
});

sequelize.sync({/*alter:true, force:true*/}).then(async () => {

    app.listen({ port: process.envPORT || 8000 }, () => {
      console.log('Server listening on http://localhost:8000');
    });
}).catch(err => console.log(err));