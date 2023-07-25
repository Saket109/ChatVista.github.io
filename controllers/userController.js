const express = require('express');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const GroupChat = require('../models/groupChatModel');
const mongoose = require("mongoose");

const bcrypt = require('bcrypt');

const registerLoad = async(req,res)=>{
    try{
        res.render('register');
    }catch(err){
        console.log(err.message);
    }
};

const register = async(req,res)=>{
    try{
        const passwordHash = await bcrypt.hash(req.body.password , 10);
        
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'images/'+req.file.filename,
            password: passwordHash,
            profile: req.body.profile
        });

        await user.save();

        res.render('register',{message : "Registration Successfully !!"});

    }catch(err){
        console.log(err.message);
    }
};

const loadLogin = async(req,res)=>{
    try{
        res.render('login');
    }catch(err){
        console.log(err.message);
    }
}

const login = async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password

        const userData = await User.findOne({email : email});

        if(userData){
            const PasswordMatch = await bcrypt.compare(password,userData.password);
            if(PasswordMatch){
                req.session.user = userData;
                res.cookie(`user`,JSON.stringify(userData));
                res.redirect('/dashboard');
            }else{
                res.render("login",{message : "Email and Password are not correct"});                
            }
        }else{
            res.render("login",{message : "Email and Password are not correct"});
        }

    }catch(err){
        console.log(err.message);
    }
}

const loadLogout = async(req,res)=>{
    try{
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/');
    }catch(err){
        console.log(err.message);
    }
}

const loadDashboard = async(req,res)=>{
    try{

        const users = await User.find({_id : {$nin : [req.session.user._id]}});


        res.render('dashboard',{ user: req.session.user , users : users});
    }catch(err){
        console.log(err.message);
    }
}

const saveChat = async(req,res)=>{
    try {
        console.log(req.body.message , req.body.sender_id , req.body.receiver_id);
        var chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message
        });

        var newChat = await chat.save();

        res.status(200).send({success:true,msg:'Chat Inserted !',data: newChat});        

    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
}

const deleteChat = async(req,res)=>{
    try {
        await Chat.deleteOne({_id : req.body.id});
        res.status(200).send({success:true});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
};

const loadGroups = async(req,res)=>{
    try {
        var groups = await Group.find({ creator_id: req.session.user._id});

        res.render('group',{ groups: groups});
    } catch (error) {
        console.log(error.message);        
    }
};

const createGroup = async(req,res)=>{
    try {
        const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.name
        })

        await group.save();

        var groups = await Group.find({ creator_id: req.session.user._id});

        res.render('group',{message: req.body.name+' Group has been created successfully !',groups: groups});
    } catch (error) {
        console.log(error.message);
    }
};

const getMembers = async(req,res)=>{
    try {
        var users = await User.find({_id : {$nin : [req.session.user._id]}});
        // var users = User.find({_id: {$nin:[req.session.user._id]},profile: "Doctor"});
        res.status(200).send({success:true , data: users});
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
};

const addMembers = async(req,res)=>{
    try {
        if(!req.body.members){
            res.status(200).send({success:false, msg:'Please Select Any One Member'});
        }else{
            await Member.deleteMany({group_id: req.body.group_id});

            var data = [];
            var members = req.body.members;

            for(let i=0;i<members.length;i++){
                data.push({
                    group_id: req.body.group_id,
                    user_id: members[i]
                })
            }

            await Member.insertMany(data);

        res.status(200).send({success:true, msg: 'Members added successfully !'});
        }
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});
    }
};

const groupChats = async(req,res)=>{
    try {
        const myGroups = await Group.find({creator_id: req.session.user._id});
        const joinedGroups = await Member.find({user_id: req.session.user._id}).populate('group_id');

        res.render('chat-group',{myGroups:myGroups , joinedGroups:joinedGroups});

    } catch (error) {
        console.log(error.message);
    }
};

const saveGroupChats = async(req,res)=>{
    try {
        var chat = new GroupChat({
            sender_id: req.body.sender_id,
            group_id : req.body.group_id,
            message: req.body.message
        });

        var newChat = await chat.save();

        var cChat = await GroupChat.findOne({_id : newChat._id}).populate('sender_id');

        res.send({success: true , chat : cChat});
    } catch (error) {
        res.send({success: false, msg:error.message});
    }
};

const loadGroupChats = async(req,res)=>{
    try {

        const groupChats = await GroupChat.find({group_id: req.body.group_id}).populate('sender_id');


        res.send({success: true , chats : groupChats});
    } catch (error) {
        res.send({success: false, msg: error.message});
    }
};

const deleteGroupChat = async(req,res)=>{
    try {

        await GroupChat.deleteOne({_id : req.body.id});

        res.send({success: true , msg: 'Chat Deleted !'});
    } catch (error) {
        res.send({success: false, msg: error.message});
    }
};


module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    loadLogout,
    loadDashboard,
    saveChat,
    deleteChat,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
    groupChats,
    saveGroupChats,
    loadGroupChats,
    deleteGroupChat
}