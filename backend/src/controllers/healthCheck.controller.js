import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";


const healthCheck = asyncHandler(async(req,res)=>{

    return res.status(200).json(
        new ApiResponse(201,{},"Everthing is OK")
    )

})


export {healthCheck}