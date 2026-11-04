const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');
const {
  createTechPOSMember,
  searchTechPOSMember,
} = require('../services/techposMemberService');

/**
 * Format user response object
 */
function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.mob_no,
    role: user.role,
    user_type: user.user_type,
    date_of_birth: user.date_of_birth,
    techpos_member_id: user.techpos_member_id,
    techpos_sync_status: user.techpos_sync_status,
    reward_points: Number(user.reward_points) || 0.00,
    reward_points_dollar_value: Number(user.reward_points_dollar_value) || 0.00,
    card_number: user.card_number,
    is_elite: Boolean(user.is_elite),
    visit_count: Number(user.visit_count) || 0,
    elite_member_start_date: user.elite_member_start_date,
    elite_member_end_date: user.elite_member_end_date,
    password_set: Boolean(user.password_set),
  };
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer or activate an in-store TechPOS member
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      first_name,
      last_name,
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      mob_no,
      dateOfBirth,
      date_of_birth,
    } = req.body;

    if (!name && !first_name && !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalPhone = mob_no || phone || null;
    const finalDob = date_of_birth || dateOfBirth || null;

    // Derive names
    const fullName = (name || '').trim();
    const nameParts = fullName.split(/\s+/);
    const finalFirstName = first_name || firstName || nameParts[0] || 'Customer';
    const finalLastName = last_name || lastName || nameParts.slice(1).join(' ') || 'Pharsyde';
    const resolvedName = fullName || `${finalFirstName} ${finalLastName}`.trim();

    // Check if user already exists locally
    const existingUser = await UserModel.findByEmail(cleanEmail);

    if (existingUser) {
      // SCENARIO 1: Existing In-Store Customer Activating Their Online Account
      if (existingUser.password_set === 0 || existingUser.password_set === false) {
        console.log(`[Customer Register] Activating in-store TechPOS account for ${cleanEmail} (Member #${existingUser.techpos_member_id})`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await UserModel.update(existingUser.id, {
          password: hashedPassword,
          password_set: true,
          name: resolvedName || existingUser.name,
          first_name: finalFirstName || existingUser.first_name,
          last_name: finalLastName || existingUser.last_name,
          mob_no: finalPhone || existingUser.mob_no,
          date_of_birth: finalDob || existingUser.date_of_birth,
          techpos_sync_status: 'synced',
          techpos_last_synced_at: new Date(),
        });

        const token = generateToken({
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        });

        return res.status(200).json({
          success: true,
          is_activated: true,
          message: `Welcome to Pharsyde! Your in-store membership (#${updatedUser.techpos_member_id || 'TechPOS'}) has been activated online.`,
          token,
          user: formatUserResponse(updatedUser),
        });
      }

      // SCENARIO 2: Already Registered with Active Online Password
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists. Please log in or reset your password.',
      });
    }

    // SCENARIO 3: Brand New Customer Registration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let techposMemberId = null;
    let syncStatus = 'pending';
    let eliteStartDate = null;
    let eliteEndDate = null;
    let rewardPoints = 0.00;
    let rewardDollarValue = 0.00;
    let cardNumber = null;
    let isElite = false;
    let visitCount = 0;

    try {
      // 1. Search if member already exists in TechPOS by email or phone
      let matches = await searchTechPOSMember({ email: cleanEmail });
      if ((!matches || matches.length === 0) && finalPhone) {
        matches = await searchTechPOSMember({ phoneNumber: finalPhone });
      }

      if (matches && matches.length > 0) {
        const matched = matches[0];
        techposMemberId = matched.id || matched.memberId || null;
        eliteStartDate = matched.eliteMemberStartDate || null;
        eliteEndDate = matched.eliteMemberEndDate || null;
        rewardPoints = Number(matched.rewardPoints) || 0.00;
        rewardDollarValue = Number(matched.rewardPointsDollarValue) || 0.00;
        cardNumber = matched.cardNumber || null;
        isElite = Boolean(matched.isElite);
        visitCount = Number(matched.visitCount) || 0;
        syncStatus = 'synced';
        console.log(`[Customer Register] Matched existing TechPOS member ID #${techposMemberId} with ${rewardPoints} points for ${cleanEmail}`);
      } else {
        // 2. Member not in TechPOS, create brand new member
        const created = await createTechPOSMember({
          name: resolvedName,
          firstName: finalFirstName,
          lastName: finalLastName,
          phone: finalPhone,
          email: cleanEmail,
          dateOfBirth: finalDob,
        });

        techposMemberId = created.memberId || null;
        syncStatus = 'synced';
        console.log(`[Customer Register] Created new TechPOS member ID #${techposMemberId} for ${cleanEmail}`);
      }
    } catch (techposError) {
      console.warn(`[Customer Register TechPOS Warning] Could not connect to TechPOS (${techposError.message}). Marked as pending sync.`);
      syncStatus = 'pending';
    }

    // Create user in database with password_set = true
    const newUser = await UserModel.create({
      name: resolvedName,
      first_name: finalFirstName,
      last_name: finalLastName,
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      user_type: role === 'admin' ? 'Admin' : 'Customer',
      mob_no: finalPhone,
      date_of_birth: finalDob,
      techpos_member_id: techposMemberId,
      elite_member_start_date: eliteStartDate,
      elite_member_end_date: eliteEndDate,
      techpos_sync_status: syncStatus,
      techpos_last_synced_at: syncStatus === 'synced' ? new Date() : null,
      password_set: true,
      reward_points: rewardPoints,
      reward_points_dollar_value: rewardDollarValue,
      card_number: cardNumber,
      is_elite: isElite,
      visit_count: visitCount,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: formatUserResponse(newUser),
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

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Check if this is an in-store member who hasn't activated their online password yet
      if (user.password_set === 0 || user.password_set === false) {
        return res.status(403).json({
          success: false,
          code: 'IN_STORE_ACCOUNT_NEEDS_ACTIVATION',
          message: 'We found your in-store TechPOS membership! Please click "Create Account" (Sign Up) to set your online password.',
          email: cleanEmail,
        });
      }

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
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile with rewards & loyalty
 * @access  Private (JWT protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: user ? formatUserResponse(user) : req.user,
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
      users: users.map(formatUserResponse),
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
