import userModel from "../models/user.model.js";
import redis from "../utils/redis.js";

export const getUserById = async (id, res) => {
  // const user=await userModel.findById(id)
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);

    res.status(201).json({
      success: true,
      user,
    });
  }
};

// get all users

export const getAllUserService = async (res) => {
  const users = await userModel.find().sort({ createdAt: -1 });
  res.status(201).json({
    success: true,
    users,
  });
};

// update user role

export const updateUserRoleService = async (res, id, role) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });

  res.status(201).json({
    success: true,
    user,
  });
};
