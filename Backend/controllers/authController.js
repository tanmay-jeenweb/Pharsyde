const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer/user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, mob_no, dateOfBirth, date_of_birth } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      user_type: role === 'admin' ? 'Admin' : 'Customer',
      mob_no: mob_no || phone || null,
      date_of_birth: date_of_birth || dateOfBirth || null,
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.mob_no,
        role: newUser.role,
        user_type: newUser.user_type,
        date_of_birth: newUser.date_of_birth,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate customer/user & get JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.mob_no,
        role: user.role,
        user_type: user.user_type,
        date_of_birth: user.date_of_birth,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private (JWT protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: user || req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/users
 * @desc    Get all users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
};
