import { ApiResponse } from "../utils/ApiReasponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    return res.status(200).json(new ApiResponse(200,"OK", "Health Check Passed"))
})

export {
    healthcheck
}
