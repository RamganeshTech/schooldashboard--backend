const bcrypt = require('bcrypt')
const AccountantModel = require("../Models/accountant.model");
const { parseExpiry } = require("../Utils/stringToSeconds");
const { generateTokens } = require("../Utils/tokenUtils");
const { validateAccountant } = require("../Validation/validation");

const jwt = require('jsonwebtoken');
const studentModel = require("../Models/student.model");
const adminNotificationModel = require("../Models/adminNotification.model");

const ExcelJS = require('exceljs');
const generateUniqueBillNo = require('../Utils/generateUniqueBillNo');
const changesmadeModel = require("../Models/changesmade.model");
const studentFeeColumns = require('../Constants/constants');
const { uploadImageToS3 } = require('../Utils/s3upload');
let accountantLogin = async (req, res) => {

    try {
        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY; // 15 minutes
        const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

        const isAccountantaccessTokenExist = req.cookies.accountantaccessToken;

        if (isAccountantaccessTokenExist) {
            return res.status(403).json({ message: "accountant already logged in", ok: false });
        }

        validateAccountant(req);

        let { email, password } = req.body
        let isExists = await AccountantModel.findOne({ email })

        if (!isExists) {
            return res.status(400).json({ message: "Invalid Email or password", ok: false })
        }

        let isMatching = await bcrypt.compare(password, isExists.password)
        if (!isMatching) {
            return res.status(400).json({ message: "Invalid Email or password", ok: false })
        }

        const accountantAccessToken = jwt.sign({ _id: isExists._id, role: "accountant" }, process.env.JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });

        const accountantRefreshToken = jwt.sign(
            { _id: isExists._id, role: "accountant" },
            process.env.REFRESH_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        res.cookie("accountantaccessToken", accountantAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(ACCESS_TOKEN_EXPIRY) * 1000  //15 min
        });

        res.cookie("accountantrefreshToken", accountantRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(REFRESH_TOKEN_EXPIRY) * 1000, // 7 days
        });

        res.status(200).json({ accountantAccessToken, message: "Login successful", ok: true });
    }
    catch (err) {
        console.log(err.message)
        res.status(401).json({ message: err.message, error: "Invalid refresh token", ok: false });
    }

}


const accountantRefreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.accountantrefreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is missing", ok: false });
        }

        const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY

        const { accessToken } = await generateTokens(payload.role, payload._id); // Generate a new access token

        res.cookie("accountantaccessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: parseExpiry(ACCESS_TOKEN_EXPIRY) * 1000  // Convert seconds to ms
        });

        res.status(200).json({ accessToken, message: "Refresh token successful", ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(403).json({ message: err.message, error: "Invalid refresh token", ok: false });
    }
}

const accountantLogout = async (req, res) => {
    try {
        // const AccountantaccessToken = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token

        // Clear the refresh token from the cookie
        res.clearCookie("accountantrefreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/", // Clear the cookie for the entire domain
        });

        res.clearCookie("accountantaccessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
        });

        res.json({ message: "Logout successful", ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Logout failed", error: err.message, ok: false });
    }
}

const isAuthenticatedUser = async (req, res) => {
    // try{
    const accountantaccessToken = req.cookies.accountantaccessToken;

    if (!accountantaccessToken) {
        return res.status(401).json({ authenticated: false, error: "authentication failed", ok: false });
    }

    jwt.verify(accountantaccessToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(" error occured in isAuthenticated api", err)
            return res.status(401).json({ authenticated: false, error: "Authentication failed: Invalid token", ok: false });
        }
        return res.status(200).json({ authenticated: true, role: decoded.role }); // Send user role if authenticated
    });
    // }
    // catch(err){
    //     console.error(err.message);
    //     res.status(401).json({ message: err.message, error: "not authenticated", ok: false });
    // }
}

const getAccountantRole = (req, res) => {
    try {
        let accountantrefreshToken = req.cookies.accountantrefreshToken

        if (!accountantrefreshToken) {
            throw new Error("Please Loggin again")
        }

        res.status(200).json({ message: "accountant role fetched successfully", data: "accountant", ok: true })
    }
    catch (err) {
        res.status(401).json({ message: err.message, error: "not authenticated", ok: false });
    }
}

const addStudent = async (req, res) => {
    try {
        let {
            srId,
            newOld,
            studentClass,
            section,
            studentName,
            adminssionAmt,
            adminssionPaidAmt,
            admissionBillNo,
            admissionDate,
            firstTermAmt,
            firstTermPaidAmt,
            firstTermBillNo,
            firstTermDate,
            secondTermAmt,
            secondTermPaidAmt,
            secondTermBillNo,
            secondTermDate,
            annualFee,
            annualPaidAmt,
            dues,
            concession,
            remarks,
            busFirstTermAmt,
            busFirstTermPaidAmt,
            busfirstTermDues,
            busSecondTermAmt,
            busSecondTermPaidAmt,
            busSecondTermDues,
            busPoint,
            whatsappNumber } = req.body

        if (!studentName.trim()) {
            throw new Error("Student name should be entered")
        }

        if (!newOld) {
            throw new Error("Please type wheather student is New or Old")
        }

        newOld = newOld.toLowerCase()

        if (adminssionPaidAmt !== null) {
            // Only generate a new bill number if the field has been updated
            admissionBillNo = await generateUniqueBillNo(5); // 5-digit bill number
        }
        if (firstTermPaidAmt !== null) {
            firstTermBillNo = await generateUniqueBillNo(5); // 5-digit bill number
        }
        if (secondTermPaidAmt !== null) {
            secondTermBillNo = await generateUniqueBillNo(5); // 5-digit bill number
        }

        let data = await studentModel.create({
            srId,
            newOld,
            studentClass,
            studentName,
            section,
            adminssionAmt,
            adminssionPaidAmt,
            admissionBillNo,
            admissionDate,
            firstTermAmt,
            firstTermPaidAmt,
            firstTermBillNo,
            firstTermDate,
            secondTermAmt,
            secondTermPaidAmt,
            secondTermBillNo,
            secondTermDate,
            annualFee,
            annualPaidAmt,
            dues,
            concession,
            remarks,
            busFirstTermAmt,
            busFirstTermPaidAmt,
            busfirstTermDues,
            busSecondTermAmt,
            busSecondTermPaidAmt,
            busSecondTermDues,
            busPoint,
            whatsappNumber,

        })

        res.status(201).json({ message: "student data succesfully created", data, ok: true })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message, error: "Student not added successfully", ok: false });
    }
}

const getStudentsList = async (req, res) => {
    try {
        let data = await studentModel.find({ isTcIssued: false })

        if (!data.length) {
            return res.status(200).json({ message: "no students Available", data, ok: true })
        }

        res.status(200).json({ message: "fetched student data succesfully", data, ok: true })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message, error: "StudentList not fetched", ok: false });
    }
}

const getTakenSRNo = async (req, res) => {
    try {
        const students = await studentModel.find({ isTcIssued: false }, 'srId');
        const taken = students.map(s => s.srId ? parseInt(s.srId.split('-')[1], 10) : null); // Extract number from "SR-104"
        res.status(200).json({ taken, ok: true, message: "sr id's fetched successfully" });
    }
    catch (err) {
        console.log("error from getSR rfrom admin", err.messaage)
        res.status(400).json({ message: err.message, error: "no Taken SR Id avaialble", ok: false });
    }
}


let updateStudentWithPermission = async (req, res) => {
    try {
        let accountantId = req.accountant._id
        let id = req.params.id


        const { studentName, fieldsRequired, studentId } = req.body
        let isExists = await studentModel.findById(id)

        if (!isExists) {
            throw new Error("student not found")
        }

        let accountantUser = await AccountantModel.findById(accountantId)

        let data = await adminNotificationModel.create({ email: accountantUser.email, requestTo: "update", fields: fieldsRequired, studentId, studentName, status: "false" })

        res.status(200).json({ message: "notification sent successsfully", data, ok: true })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message, error: "Student not added successfully", ok: false });
    }
}

let updateStudentDirectly = async (req, res) => {
    try {
        let accountantId = req.accountant._id
        let id = req.params.id
        const updatedFields = req.body

        let isExists = await studentModel.findById(id)

        if (!isExists) {
            throw new Error("student not found")
        }

        if (updatedFields.adminssionPaidAmt !== undefined && isExists.adminssionPaidAmt !== updatedFields.adminssionPaidAmt) {
            updatedFields.admissionBillNo = await generateUniqueBillNo(5);
        }
        if (updatedFields.firstTermPaidAmt !== undefined && isExists.firstTermPaidAmt !== updatedFields.firstTermPaidAmt) {
            updatedFields.firstTermBillNo = await generateUniqueBillNo(5);
        }
        if (updatedFields.secondTermPaidAmt !== undefined && isExists.secondTermPaidAmt !== updatedFields.secondTermPaidAmt) {
            updatedFields.secondTermBillNo = await generateUniqueBillNo(5);
        }

        let data = await studentModel.findByIdAndUpdate(isExists._id, updatedFields, { returnDoucumnet: "after" })
        res.status(200).json({ message: "updated student successsfully", data, ok: true })
    }
    catch (err) {
        console.log(err.message)
        res.status(400).json({ message: err.message, error: "Student not added successfully", ok: false });
    }
}

const getPermissionStatus = async (req, res) => {
    try {
        let accountantId = req.accountant._id

        const accountant = await AccountantModel.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Accountant not found" });
        }

        return res.status(200).json({ permissionStatus: accountant.permissionStatus });
    }
    catch (err) {
        console.log(err.message)
        res.status(400).json({ message: err.message, error: "accountant status not fetched properly", ok: false });
    }
}

const changesMadeOnDate = async (req, res) => {
    try {
        let { modifiedDate, fieldsModified, modifiedBy, relationId } = req.body
        modifiedBy = req.accountant._id
        let accountant = await AccountantModel.findById({ _id: modifiedBy })

        if (!accountant) {
            modifiedBy = "N/A"
        } else {
            modifiedBy = accountant.email
        }

        let data = await changesmadeModel.create({ modifiedDate, fieldsModified, modifiedBy, relationId })

        res.status(200).json({ message: "created successfully", data, ok: true })
    }
    catch (err) {
        console.log("error from changesMadeOnDate", err.messaage)
        res.status(400).json({ message: err.message, error: "no changes made successfully", ok: false });
    }
}

const changesRetrived = async (req, res) => {
    try {
        let { date } = req.params

        let data = await changesmadeModel.find({ modifiedDate: date })
        res.status(200).json({ message: "retrived successfully", data, ok: true })

    }
    catch (err) {
        console.log("error from changesRetrived", err.messaage)
        res.status(400).json({ message: err.message, error: "no changes retrived successfully", ok: false });
    }
}

const editStudentMandatoryDetails = async (req, res) => {
    try {
        let { studentId } = req.params
        let { profileData } = req.body;

        let isExists = await studentModel.findById(studentId)

        if (!isExists) {
            return res.status(404).json({ message: "Student not found", ok: false });
        }

        Object.entries(profileData).forEach(([key, value]) => {
            isExists.mandatory[key] = value
        })

        await isExists.save()

        res.status(200).json({ message: "updated student profile data successfully", data: isExists, ok: true })

    }
    catch (err) {
        console.log("error from editStudentProfile", err.messaage)
        res.status(400).json({ message: err.message, error: "no updateion made in student profile", ok: false });
    }
}

const editStudentNonMandatoryDetails = async (req, res) => {
    try {
        let { studentId } = req.params
        let { nonMandatory } = req.body;

        console.log("profile data", nonMandatory)

        let isExists = await studentModel.findById(studentId)

        if (!isExists) {
            return res.status(404).json({ message: "Student not found", ok: false });
        }

        Object.entries(nonMandatory).forEach(([key, value]) => {
            isExists.nonMandatory[key] = value
        })

        await isExists.save()

        res.status(200).json({ message: "updated student non mandatory profile data successfully", data: isExists, ok: true })

    }
    catch (err) {
        console.log("error from editStudentProfile", err.messaage)
        res.status(400).json({ message: err.message, error: "no updateion made in student profile", ok: false });
    }
}


const generateExcelFile = async (req, res) => {
    try {
        const students = await studentModel.find(); // fetch your data

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        // Add headers
        worksheet.columns = studentFeeColumns

        // Add rows
        students.forEach((student) => {
            worksheet.addRow({
                newOld: student.newOld,
                studentClass: student.studentClass,
                section: student.section,
                studentName: student.studentName,

                adminssionAmt: student.adminssionAmt,
                adminssionPaidAmt: student.adminssionPaidAmt,
                admissionBillNo: student.admissionBillNo,
                admissionDate: student.admissionDate,

                firstTermAmt: student.firstTermAmt,
                firstTermPaidAmt: student.firstTermPaidAmt,
                firstTermBillNo: student.firstTermBillNo,
                firstTermDate: student.firstTermDate,

                secondTermAmt: student.secondTermAmt,
                secondTermPaidAmt: student.secondTermPaidAmt,
                secondTermBillNo: student.secondTermBillNo,
                secondTermDate: student.secondTermDate,

                annualFee: student.annualFee,
                annualPaidAmt: student.annualPaidAmt,
                dues: student.dues,
                concession: student.concession,
                remarks: student.remarks,

                busFirstTermAmt: student.busFirstTermAmt,
                busFirstTermPaidAmt: student.busFirstTermPaidAmt,
                busfirstTermDues: student.busfirstTermDues,

                busSecondTermAmt: student.busSecondTermAmt,
                busSecondTermPaidAmt: student.busSecondTermPaidAmt,
                busSecondTermDues: student.busSecondTermDues,

                busPoint: student.busPoint,
                whatsappNumber: student.whatsappNumber,
            });
        })

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'StudentsFee.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    }
    catch (err) {
        console.log("error from generate Excel file from accountant", err.messaage)
        res.status(400).json({ message: err.message, error: "Excel file is not generated", ok: false });

    }
}


const searchStudent = async (req, res) => {
    try {
        const { query } = req.query;

        let searchResult;

        const isNumeric = /^[0-9]+$/.test(query);

        if (isNumeric) {
            // Search by SR ID (exact match or partial match)
            searchResult = await studentModel.find({
                srId: { $regex: query, $options: 'i' }, isTcIssued: false
            });
        } else {
            // Search by student name (case-insensitive)
            searchResult = await studentModel.find({
                studentName: { $regex: query, $options: 'i' }, isTcIssued: false
            });
        }

        res.status(200).json({ data: searchResult, ok: false });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const uploadStudentImage = async (req, res) => {
    try {
          let {studentId} = req.params

        const file = req.file
        // console.log('Received file:', files.originalname, files.mimetype); // Check file mime type and name

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const uploadedUrl = "https://static.vecteezy.com/system/resources/previews/024/724/633/non_2x/a-happy-smiling-young-college-student-with-a-book-in-hand-isolated-on-a-transparent-background-generative-ai-free-png.png"
        
        // await new Promise(res=> setTimeout(res(), 2000))
        // const uploadedUrl = await uploadImageToS3(file)

        let data = await studentModel.findByIdAndUpdate(studentId, { studentImage: uploadedUrl }, { returnDocument: "after" })

        res.status(200).json({ image: uploadedUrl, data, message:"image updated successfully" , ok:true});
    } catch (error) {
        console.log("Image upload failed", error)
        res.status(500).json({ message: 'Image upload failed', error, ok: false });
    }
};

module.exports = {
    accountantLogin,
    accountantRefreshAccessToken,
    accountantLogout,
    isAuthenticatedUser,
    getAccountantRole,
    addStudent,
    getStudentsList,
    updateStudentWithPermission,
    updateStudentDirectly,
    getPermissionStatus,
    changesMadeOnDate,
    changesRetrived,
    editStudentMandatoryDetails,
    editStudentNonMandatoryDetails,

    getTakenSRNo,
    generateExcelFile,
    searchStudent,
    uploadStudentImage
}