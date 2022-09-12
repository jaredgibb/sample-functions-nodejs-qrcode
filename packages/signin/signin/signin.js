const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const cors = require('cors')({ origin: true });



module.exports.signup = async function (req, res)  {
    cors(req, res, async () => {
         
        const email = req.body.email;
        const first = req.body.firstName;
        const last = req.body.lastName;
        const org = req.body.org;
        const uid = req.body.uid
        const role = req.body.role
        let img = req.body.img;
    
        //get references for the firestore collecctions
        const users = db.collection('users')
        const orgs = db.collection('orgs')
        

    
        function createrole(role, orgID, uid) {
            return new Promise(function (res, rej) {
                const roles = db.collection('orgs/' + orgID + '/roles')
                roles.add({
                    title: role,
                    createdBy: uid
                }).then(x => {
                    res(x.id)
                }).catch(err => {
                    rej(err)
                    console.log(JSON.stringify(err))
                })
            })
        }
    
        //add the user to the users table
        function createUser(uid, orgID, roleID) {
            return new Promise(function (resolve, reject) {
                users.doc(uid).set({
                    email: email,
                    firstName: first,
                    lastName: last,
                    orgID: orgID,
                    uid: uid,
                    role: roleID,
                    isAdmin: true,
                    isSuperAdmin: true,
                    avatar: (img)?img:`https://eu.ui-avatars.com/api/?name=${first}+${last}`
                }).then((res) => {
                    resolve(uid)
                }).catch(e => {
                    reject(e)
                })
            })
        }
    
        //create the users organization
        function createOrg(o) {
            return new Promise(function (resolve, reject) {
                orgs.add({
                    org: o
                }).then((res) => {
                    resolve(res.id)
                }).catch(e => {
                    reject(e)
                })
            })
        }
    
        try {
            //create  the org
            const orgID = await createOrg(org)
            console.log(orgID)
            //create the role
            const roleID = await createrole(role, orgID, uid)
            
            //add org and role to user then add user to the user collection
            const userID = await createUser(uid, orgID, roleID)
            //send a success messasge

            const u = {
                email: email,
                firstName: first,
                lastname: last,
                orgID: org,
                uid: uid,
                role: role,
                isAdmin: true,
                isSuperAdmin: true,
                avatar:(img) ? img : `https://eu.ui-avatars.com/api/?name=${first}+${last}`
            }
            const orgUsers = db.collection('orgs/' + orgID + '/employees')
            const addToUserBase = await orgUsers.doc(userID).set(u)
            console.log(addToUserBase.id)
            res.send(u).status(200)
        } catch (error) {
            res.send({ status: false, message: JSON.stringify(error) }).status(400)
        }

    })
    
}
