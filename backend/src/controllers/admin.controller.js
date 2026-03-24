import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createManagedUser,
  listManagedUsers,
  updateManagedUser,
} from "../services/admin.service.js";

const parseIsActiveFilter = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

export const createUser = asyncHandler(async (req, res) => {
  const user = await createManagedUser(req.body);
  return res.status(201).json(new ApiResponse(201, user, "User created"));
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await listManagedUsers({
    role: req.query.role,
    isActive: parseIsActiveFilter(req.query.isActive),
    ldapId: req.query.ldapId,
  });

  return res.status(200).json(new ApiResponse(200, users, "Users fetched"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await updateManagedUser(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, user, "User updated"));
});
