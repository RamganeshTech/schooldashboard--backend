const { validateAdmin, validateAccountant } = require("../Validation/validation")

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const StudentModel = require('../Models/student.model')


const { generateTokens } = require("../Utils/tokenUtils");

const AccountantModel = require("../Models/accountant.model");

const DeletedAccountantCredentialsModel = require("../Models/deletedAccountantCredentials.model");
const { parseExpiry } = require("../Utils/stringToSeconds");
const adminNotificationModel = require("../Models/adminNotification.model");
const generateUniqueBillNo = require('../Utils/generateUniqueBillNo');
const changesmadeModel = require("../Models/changesmade.model");




const adminLogin = async (req, res) => {
    try {
        const isaccessTokenExist = req.cookies.accessToken;

        if (isaccessTokenExist) {
            return res.status(403).json({ message: "Admin already logged in", ok: false });
        }

        if (isaccessTokenExist) {
            
            return res.status(403).json({ message: "Admin already logged in", ok: false });
        
        }

        validateAdmin(req);

        const { accessToken, refreshToken } = await generateTokens("admin");

        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY; // 15 minutes
        const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;


        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(ACCESS_TOKEN_EXPIRY) * 1000 
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(REFRESH_TOKEN_EXPIRY) * 1000, 
        });

        res.status(200).json({ accessToken, message: "Login successful", ok: true });
    }
    catch (err) {
        console.log("error from adminLogin api", err.message)
        res.status(401).json({ message: err.message, ok: false });
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken; // Get refresh token from HTTP-only cookie

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is missing, please login", ok: false });
        }

        const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        const { accessToken } = await generateTokens(payload.role); // Generate a new access token

      
        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY; // 15 minutes

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(ACCESS_TOKEN_EXPIRY) * 1000 // Convert seconds to ms
        });

        res.status(200).json({ accessToken, message: "Refresh token successful", ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(403).json({ message: err.message, error: "Invalid refresh token", ok: false });
    }
}

const adminLogout = async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token
      

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/", 
        });

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
        });

        res.json({ message: "Logout successful", ok: true });
    } catch (err) {
        console.error("error from adminLogout api",err.message);
        res.status(400).json({ message: err.message, error: "logout failed", ok: false });
    }
}

const isAuthenticatedUser = async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken; 

        if (!accessToken) {
            return res.status(401).json({ authenticated: false, error: "authentication failed", ok: false });
        }
     
        jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log(err)
                return res.status(401).json({ authenticated: false, ok: false });
            }
            return res.status(200).json({ authenticated: true, role: decoded.role, ok:true }); // Send user role if authenticated
        });
    }
    catch (err) {
        console.error("error from isAuthrviated user Api",err.message);
        res.status(401).json({ message: err.message, error: "not authenticated", ok: false });
    }
}

const getAdminRole = (req, res) => {
    try {
        let refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            throw new Error("Please Loggin again")
        }

        res.status(200).json({ message: "role fetched successfully", data: "admin", ok: true })
    }
    catch (err) {
        console.log("error from getAdminRole api", err.message)
        res.status(401).json({ message: err.message, error: "not authenticated", ok: false });
    }
}

const createAccountantCredential = async (req, res) => {
    try {
        let { email, password } = req.body

        validateAccountant(req)

        let currentPassword = await bcrypt.hash(password, 10)


        let isExistsInDeleted = await DeletedAccountantCredentialsModel.findOne({ email })

        if (isExistsInDeleted) {
            throw new Error("email already present, please select new one")
        }

        let deletedAccountantData = await DeletedAccountantCredentialsModel.create({ email, password: currentPassword, status: true })
        let accountantData = await AccountantModel.create({ email, password: currentPassword, relationId: deletedAccountantData._id })

        res.status(201).json({ message: "credential created", data: deletedAccountantData, accountantData, ok: true })

    }
    catch (err) {
        console.log("error from createAccountantCredential api",err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })

    }
}

const getDeletedAccountantCredentials = async (req, res) => {
    try {
        let data = await DeletedAccountantCredentialsModel.find({})

        res.status(201).json({ message: "Credentials retrived Successfully", data, ok: true })
    }
    catch (err) {
        console.log("error from getDeletedAccountantCredentials api",err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}

const deleteAccountantCredential = async (req, res) => {
    try {
        let id = req.params.id

        let isExists = await DeletedAccountantCredentialsModel.exists({ _id: id })

        if (!isExists) {
            throw new Error("no data found with the given id")
        }

        let data = await DeletedAccountantCredentialsModel.findByIdAndUpdate(id, { status: false }, { returnDocument: "after" })
        const deletedAccountant = await AccountantModel.findOneAndDelete({ relationId: id });

        if (!deletedAccountant) {
            throw new Error("No corresponding accountant found for deletion");
        }

        res.status(201).json({ message: "Credential deleted successfully", data, ok: true })

    }
    catch (err) {
        console.log("errror from deleteAcounantCredentials", err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}

const getNotifications = async (req, res) => {
    try {

        let data = await adminNotificationModel.find()

        if (!data.length) {
          return  res.status(200).json({ message: "No notificatios received yet...", data, ok: true })
        }

        res.status(200).json({ message: "Fetched Notification successfully", data, ok: true })
    }
    catch (err) {
        console.log("errror from  getNotification api", err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}

const acceptNotification = async (req, res) => {
    try {
        let id = req.params.id
        let isExists = await adminNotificationModel.findById(id)

        if (!isExists) {
            throw new Error("No such notification exists")
        }
        let data = await adminNotificationModel.findByIdAndUpdate(isExists.id, { status: true }, { returnDocument: "after" })

        if (!data.fields) {
            throw new Error("No fields to update in the notification");
        }

        let isExistsStudent = await StudentModel.findById(data.studentId)

        if (!isExistsStudent) {
            throw new Error("No Student Found")
        }


        if (data.fields.adminssionPaidAmt !== undefined && isExistsStudent.adminssionPaidAmt !== data.fields.adminssionPaidAmt) {
            if (data.fields.adminssionPaidAmt !== 0) {
                data.fields.admissionBillNo = await generateUniqueBillNo(5); 
            } else {
                 data.fields.admissionBillNo = null; 
            }
        }

        if (data.fields.firstTermPaidAmt !== undefined && isExistsStudent.firstTermPaidAmt !== data.fields.firstTermPaidAmt) {
            if (data.fields.firstTermPaidAmt !== 0) {
                data.fields.firstTermBillNo = await generateUniqueBillNo(5); 
            } else {
                 data.fields.firstTermBillNo = null; 
            }
        }

        if (data.fields.secondTermPaidAmt !== undefined && isExistsStudent.secondTermPaidAmt !== data.fields.secondTermPaidAmt) {
            if (data.fields.secondTermPaidAmt !== 0) {
                data.fields.secondTermBillNo = await generateUniqueBillNo(5); 
            } else {
                 data.fields.secondTermBillNo= null; 
            }
        }


        let studentData = await StudentModel.findByIdAndUpdate(data.studentId, data.fields, { returnDocument: "after" })

        await adminNotificationModel.findByIdAndDelete(id)

        res.status(200).json({ message: "accepted and updated successfully", data, ok: true })

    }
    catch (err) {
        console.log("error form accept notificaiton api", err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}

const rejectNotification = async (req, res) => {
    try {
        let id = req.params.id
        let isExists = await adminNotificationModel.findById(id)

        if (!isExists) {
            throw new Error("No such notification exists")
        }

        let data = await adminNotificationModel.findByIdAndUpdate(id, { status: false }, { returnDocument: "after" })
        await adminNotificationModel.findByIdAndDelete(id)

        res.status(200).json({ message: "rejected update request", data, ok: true })

    }
    catch (err) {
        console.log("error from reject notification", err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}


const updateStudentAdmin = async (req, res) => {
    try {
        let id = req.params.id

        const fieldsToUpdate = req.body

        
        let isExistsStudent = await StudentModel.findById(id)
        
        if (!isExistsStudent) {
            throw new Error("No Student Found")
        }
        
        
       

        if (fieldsToUpdate.adminssionPaidAmt !== undefined && isExistsStudent.adminssionPaidAmt !== fieldsToUpdate.adminssionPaidAmt) {
            if (fieldsToUpdate.adminssionPaidAmt !== 0) {
                fieldsToUpdate.admissionBillNo = await generateUniqueBillNo(5); 
            } else {
                 fieldsToUpdate.admissionBillNo = null; 
            }
        }

        
        if (fieldsToUpdate.firstTermPaidAmt !== undefined && isExistsStudent.firstTermPaidAmt !== fieldsToUpdate.firstTermPaidAmt) {
            if (fieldsToUpdate.firstTermPaidAmt !== 0) {
                fieldsToUpdate.firstTermBillNo = await generateUniqueBillNo(5); 
            } else {
                 fieldsToUpdate.firstTermBillNo = null; 
            }
        }

        if (fieldsToUpdate.secondTermPaidAmt !== undefined && isExistsStudent.secondTermPaidAmt !== fieldsToUpdate.secondTermPaidAmt) {
            if (fieldsToUpdate.secondTermPaidAmt !== 0) {
                fieldsToUpdate.secondTermBillNo = await generateUniqueBillNo(5); 
            } else {
                 fieldsToUpdate.secondTermBillNo= null; 
            }
        }


        let data = await StudentModel.findByIdAndUpdate(id, fieldsToUpdate, { returnDocument: "after" })

        res.status(200).json({ message: "updated student data successfully", data, ok: true })
    }
    catch (err) {
        console.log("error form updateStudentAdmin api", err.message)
        res.status(400).json({ message: err.message, error: "error occured", ok: false })
    }
}


const getStudentsList = async (req, res) => {
    try {
        let data = await StudentModel.find({})

        if (!data.length) {
         return res.status(200).json({ message: "no students Available", data, ok: true })
        }
        
        res.status(200).json({ message: "fetched student data succesfully", data, ok: true })
    }
    catch (err) {
        console.log("error from getStudentsList", err.messaage)
        res.status(400).json({ message: err.message, error: "StudentList not fetched", ok: false });
    }
}

const getActiveAccountant = async (req, res)=>{
    try{
        let data = await AccountantModel.find({})

        if(!data.length){
            throw new Error("no Accountants found")
        }

        res.status(200).json({ message: "fetched accountant data succesfully", data, ok: true })

    }
    catch(err){
        console.log("error from getActiveAccountant", err.messaage)
        res.status(400).json({ message: err.message, error: "Accountant not fetched", ok: false });
    }
}

const updatePermissionAccountant = async (req, res)=>{
    try{
        let id = req.params.id
        let { permissionStatus } = req.body

        
        let data = await AccountantModel.findByIdAndUpdate(
            id, 
            { permissionStatus }, 
            { returnDocument: "after" }  
        )

        if (!data) {
            throw new Error("Accountant not found")  
        }

        res.status(200).json({ message: "Updated permission successfully", data, ok: true })
   }
    catch(err){
        console.log("error from getActiveAccountant", err.messaage)
        res.status(400).json({ message: err.message, error: "not Updated permsison successfully", ok: false });
    }
}

const changesMadeOnDate = async(req, res)=>{
    try{
        let { modifiedDate, fieldsModified, modifiedBy, relationId}= req.body
        modifiedBy = req.admin.role
        let data = await changesmadeModel.create({ modifiedDate, fieldsModified, modifiedBy, relationId})

        res.status(200).json({message:"created successfully", data, ok:true})
    }
    catch(err){
        console.log("error from changesMadeOnDate", err.messaage)
        res.status(400).json({ message: err.message, error: "no changes made successfully", ok: false });
    }
}

const changesRetrived = async (req, res)=>{
    try{
        let {date} = req.params

        let data = await changesmadeModel.find({modifiedDate:date})
        res.status(200).json({message:"retrived successfully", data, ok:true})

    }
    catch(err){
        console.log("error from changesRetrived", err.messaage)
        res.status(400).json({ message: err.message, error: "no changes retrived successfully", ok: false }); 
    }
}

const editStudentMandatoryDetails = async (req, res)=>{
    try {
        let { studentId } = req.params
        let {profileData} = req.body;

        let isExists = await StudentModel.findById(studentId)

        if (!isExists) {
            return res.status(404).json({ message: "Student not found", ok:false });
        }

       Object.entries(profileData).forEach(([key, value])=>{
        isExists.mandatory[key]=value
       })

        await isExists.save()

        res.status(200).json({ message: "updated student profile data successfully", data:isExists, ok: true })

    }
    catch (err) {
        console.log("error from editStudentProfile", err.messaage)
        res.status(400).json({ message: err.message, error: "no updateion made in student profile", ok: false });
    }
}

const editStudentNonMandatoryDetails = async (req, res)=>{
    try {
        let { studentId } = req.params
        let {nonMandatory} = req.body;

        let isExists = await StudentModel.findById(studentId)

        if (!isExists) {
            return res.status(404).json({ message: "Student not found", ok:false });
        }

       Object.entries(nonMandatory).forEach(([key, value])=>{
        isExists.nonMandatory[key]=value
       })

        await isExists.save()
        res.status(200).json({ message: "updated student profile data successfully", data:isExists, ok: true })
    }
    catch (err) {
        console.log("error from editStudentProfile", err.messaage)
        res.status(400).json({ message: err.message, error: "no updateion made in student profile", ok: false });
    }
}

module.exports = {
    adminLogin,
    refreshAccessToken,
    adminLogout,
    isAuthenticatedUser,
    getAdminRole,
    createAccountantCredential,
    getDeletedAccountantCredentials,
    deleteAccountantCredential,
    getNotifications,
    acceptNotification,
    rejectNotification,
    updateStudentAdmin,
    getStudentsList,
    getActiveAccountant,
    updatePermissionAccountant,
    changesMadeOnDate,
    changesRetrived,
    editStudentMandatoryDetails,
    editStudentNonMandatoryDetails,

}