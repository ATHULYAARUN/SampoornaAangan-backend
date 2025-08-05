const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('role')
    .isIn(['anganwadi-worker', 'asha-volunteer', 'parent', 'adolescent-girl', 'sanitation-worker'])
    .withMessage('Invalid role selected'),
    
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
    
  body('address.pincode')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be 6 digits'),
    
  handleValidationErrors,
];

// User login validation
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  body('role')
    .isIn(['anganwadi-worker', 'asha-volunteer', 'parent', 'adolescent-girl', 'sanitation-worker'])
    .withMessage('Role selection is required'),
    
  handleValidationErrors,
];

// Admin login validation
const validateAdminLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors,
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
    
  body('address.pincode')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be 6 digits'),
    
  body('preferences.language')
    .optional()
    .isIn(['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'ml'])
    .withMessage('Invalid language selection'),
    
  handleValidationErrors,
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Role-specific validation for adolescent
const validateAdolescentData = [
  body('roleSpecificData.adolescentDetails.age')
    .optional()
    .isInt({ min: 10, max: 19 })
    .withMessage('Age must be between 10 and 19 years'),
    
  body('roleSpecificData.adolescentDetails.guardianPhone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Guardian phone number must be 10 digits'),
    
  handleValidationErrors,
];

// Role-specific validation for parent
const validateParentData = [
  body('roleSpecificData.parentDetails.children')
    .optional()
    .isArray()
    .withMessage('Children data must be an array'),
    
  body('roleSpecificData.parentDetails.children.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Child name must be between 2 and 50 characters'),
    
  body('roleSpecificData.parentDetails.children.*.age')
    .optional()
    .isInt({ min: 0, max: 18 })
    .withMessage('Child age must be between 0 and 18 years'),
    
  body('roleSpecificData.parentDetails.familySize')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Family size must be between 1 and 20'),
    
  handleValidationErrors,
];

// ID parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  handleValidationErrors,
];

// Query parameter validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'email', '-email'])
    .withMessage('Invalid sort parameter'),
    
  handleValidationErrors,
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('role')
    .optional()
    .isIn(['anganwadi-worker', 'asha-volunteer', 'parent', 'adolescent-girl', 'sanitation-worker'])
    .withMessage('Invalid role filter'),
    
  query('district')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('District name must be between 2 and 50 characters'),
    
  handleValidationErrors,
];

// File upload validation
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['image', 'document', 'report'])
    .withMessage('Invalid file type'),
    
  handleValidationErrors,
];

// Email validation
const validateEmail = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  handleValidationErrors,
];

// Phone validation
const validatePhone = [
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
    
  handleValidationErrors,
];

// Custom validation for role-specific data
const validateRoleSpecificData = (req, res, next) => {
  const { role, roleSpecificData } = req.body;
  
  if (!role || !roleSpecificData) {
    return next();
  }
  
  const errors = [];
  
  switch (role) {
    case 'adolescent-girl':
      if (roleSpecificData.adolescentDetails) {
        const { age } = roleSpecificData.adolescentDetails;
        if (age && (age < 10 || age > 19)) {
          errors.push({
            field: 'roleSpecificData.adolescentDetails.age',
            message: 'Age must be between 10 and 19 years',
            value: age,
          });
        }
      }
      break;
      
    case 'parent':
      if (roleSpecificData.parentDetails && roleSpecificData.parentDetails.children) {
        const { children } = roleSpecificData.parentDetails;
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            if (child.age && (child.age < 0 || child.age > 18)) {
              errors.push({
                field: `roleSpecificData.parentDetails.children[${index}].age`,
                message: 'Child age must be between 0 and 18 years',
                value: child.age,
              });
            }
          });
        }
      }
      break;
      
    case 'sanitation-worker':
      if (roleSpecificData.sanitationDetails) {
        const { employeeId } = roleSpecificData.sanitationDetails;
        if (employeeId && employeeId.length < 3) {
          errors.push({
            field: 'roleSpecificData.sanitationDetails.employeeId',
            message: 'Employee ID must be at least 3 characters long',
            value: employeeId,
          });
        }
      }
      break;
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Role-specific data validation failed',
      errors,
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateAdolescentData,
  validateParentData,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateFileUpload,
  validateEmail,
  validatePhone,
  validateRoleSpecificData,
};