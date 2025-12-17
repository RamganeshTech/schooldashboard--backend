
const validateAdmin = (req)=>{
    let {email, password} = req.body

    let adminEmail = process.env.ADMIN_EMAIL
    let adminPassword = process.env.ADMIN_PASSWORD
      
    if(!email){
        throw new Error("Enter the Email")
      }

      if(!password){
        throw new Error("Enter the Password")
      }

      if(email !== adminEmail || password !== adminPassword){
        throw new Error("Invalid email or password")
      }
}

const validateAccountant = async  (req)=>{
  let {email, password} = req.body

   
    if(!email){
        throw new Error("Enter the Email")
      }

      if(!password){
        throw new Error("Enter the Password")
      }

}

// module.exports = {
//   validateAdmin,
//   validateAccountant
// }


export {
  validateAdmin,
validateAccountant
}