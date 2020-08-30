const express=require('express')
const router=express.Router()
const auth=require('../middleware/auth')
const User=require('../models/user')

var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false })


router.post('/user/signup',urlencodedParser,async(req,res)=>{
    const user=new User(req.body)
    try {
        await user.save()
        const token=await user.generateAuthToken()
        res.status(201).send({user,token})
       }catch(e){
        res.status(400).send(e)
       }
})


router.post('/users/login',urlencodedParser,async(req,res)=>{
    try{
        const user=await User.findByCredentials(req.body.email,req.body.password)
        const token=await user.generateAuthToken()
        res.send({user:user,token:token})

    }catch(e){
        res.status(400).send()
    }

})
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!==req.token
        })
        await req.user.save()

        res.send('logouted')

    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send('logouted from all')
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth,async (req,res)=>{
    res.send(req.user)
})

router.patch('/users/me',auth,async (req,res)=>{
    const updates =Object.keys(req.body)
    const allowupdates=['name','email','password']
    const isvalid=updates.every((update)=>{
        return allowupdates.includes(update)
    })
    if(!isvalid){
        return res.status(400).send({'error':'invalid updates'})
    }
    try{
        const user=await req.user
        updates.forEach((update)=>{
            user[update]=req.body[update]
        })
        await user.save()
        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    }catch(e)
    {
        res.status(400).send()
    }
})


module.exports=router;