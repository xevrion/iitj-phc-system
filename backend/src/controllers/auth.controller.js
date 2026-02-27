import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginUser, getCurrentUser } from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { ldapId, password } = req.body;
  const { token, user } = await loginUser(ldapId, password);
  return res
    .status(200)
    .json(new ApiResponse(200, { token, user }, "Login successful"));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  return res.status(200).json(new ApiResponse(200, user, "User fetched"));
});
